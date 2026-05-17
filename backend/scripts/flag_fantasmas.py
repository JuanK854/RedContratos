import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

PAGE_SIZE     = 1000
SCORE_MIN     = 70
MIN_CONTRATOS = 3


def fetch_all(client, table, fields):
    records = []
    offset = 0
    while True:
        resp = (
            client.table(table)
            .select(fields)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        batch = resp.data
        records.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return records


def main():
    print("Conectando a Supabase...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Descargando contratos...")
    contratos = fetch_all(client, "contratos", "rfc,fecha_inicio,institucion")
    print(f"  {len(contratos):,} contratos")

    # Agrupar por RFC: fechas e instituciones
    datos_por_rfc: dict[str, dict] = {}
    for row in contratos:
        rfc = row.get("rfc")
        if not rfc:
            continue
        entry = datos_por_rfc.setdefault(rfc, {"fechas": [], "instituciones": []})
        entry["fechas"].append(row.get("fecha_inicio") or "")
        entry["instituciones"].append(row.get("institucion") or "")

    # Criterio 1+3+4: solo 2026, >= MIN_CONTRATOS, todas instituciones distintas
    rfcs_solo_2026 = set()
    for rfc, data in datos_por_rfc.items():
        fechas = data["fechas"]
        instituciones = data["instituciones"]
        if len(fechas) < MIN_CONTRATOS:
            continue
        if not all("/2026" in f for f in fechas):
            continue
        # Todas las instituciones deben ser diferentes (no proveedor habitual de una sola entidad)
        if len(set(instituciones)) < len(instituciones):
            continue
        rfcs_solo_2026.add(rfc)

    print(f"  {len(rfcs_solo_2026):,} RFCs: solo 2026, >={MIN_CONTRATOS} contratos, instituciones distintas")

    print("Descargando proveedores...")
    proveedores = fetch_all(client, "proveedores", "rfc,nombre,score,total_contratos")
    print(f"  {len(proveedores):,} proveedores")

    # Criterio 2: score >= SCORE_MIN
    fantasmas = [
        p for p in proveedores
        if p["rfc"] in rfcs_solo_2026 and (p.get("score") or 0) >= SCORE_MIN
    ]
    print(f"  {len(fantasmas):,} empresas fantasma (todos los criterios cumplidos)")

    if not fantasmas:
        print("No se encontraron empresas fantasma.")
        return

    # Actualizar flag_fantasma en lotes de 50
    rfcs = [p["rfc"] for p in fantasmas]
    BATCH = 50
    updated = 0
    for i in range(0, len(rfcs), BATCH):
        chunk = rfcs[i : i + BATCH]
        client.table("proveedores").update({"flag_fantasma": True}).in_("rfc", chunk).execute()
        updated += len(chunk)

    print(f"\n{updated} proveedores actualizados con flag_fantasma = true\n")
    print("Empresas fantasma detectadas:")
    for p in sorted(fantasmas, key=lambda x: x.get("score") or 0, reverse=True):
        print(f"  {p['nombre']} | {p['rfc']} | score: {p.get('score', 0)} | contratos: {p.get('total_contratos', '?')}")


if __name__ == "__main__":
    main()
