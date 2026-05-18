import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

PAGE_SIZE = 1000
SCORE_MIN = 70


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

    print("Reseteando flag_fantasma...")
    client.table("proveedores").update({"flag_fantasma": False}).neq("rfc", "").execute()

    print("Descargando contratos...")
    contratos = fetch_all(client, "contratos", "rfc,fecha_inicio")
    print(f"  {len(contratos):,} contratos")

    # Agrupar fechas por RFC
    fechas_por_rfc: dict[str, list] = {}
    for row in contratos:
        rfc = row.get("rfc")
        if not rfc:
            continue
        fechas_por_rfc.setdefault(rfc, []).append(row.get("fecha_inicio") or "")

    # Criterio 1: todos los contratos del RFC son de 2026
    rfcs_solo_2026 = {
        rfc
        for rfc, fechas in fechas_por_rfc.items()
        if fechas and all("/2026" in f or f.startswith("2026") for f in fechas)
    }
    print(f"  {len(rfcs_solo_2026):,} RFCs con contratos solo en 2026")

    print("Descargando proveedores...")
    proveedores = fetch_all(client, "proveedores", "rfc,nombre,score,total_contratos,total_monto")
    print(f"  {len(proveedores):,} proveedores")

    # Percentil 75 de total_monto sobre todos los proveedores
    montos = sorted(float(p["total_monto"]) for p in proveedores if p.get("total_monto") is not None)
    p75_monto = montos[int(len(montos) * 0.75)] if montos else 0
    print(f"  Percentil 75 de total_monto: ${p75_monto:,.0f}")

    # Criterios 2 + 4: score >= SCORE_MIN y total_monto > p75
    fantasmas = [
        p for p in proveedores
        if p["rfc"] in rfcs_solo_2026
        and (p.get("score") or 0) >= SCORE_MIN
        and float(p.get("total_monto") or 0) > p75_monto
    ]
    print(f"  {len(fantasmas):,} empresas fantasma (solo 2026, score >= {SCORE_MIN}, monto > p75)")

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
    for p in sorted(fantasmas, key=lambda x: float(x.get("total_monto") or 0), reverse=True):
        monto = float(p.get("total_monto") or 0)
        monto_str = f"${monto/1e9:.1f}B" if monto >= 1e9 else f"${monto/1e6:.0f}M"
        print(f"  {p['nombre']} | {p['rfc']} | score: {p.get('score', 0)} | contratos: {p.get('total_contratos', '?')} | {monto_str}")


if __name__ == "__main__":
    main()
