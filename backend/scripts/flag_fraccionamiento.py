import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

PAGE_SIZE          = 1000
MIN_ADJ_MISMA_INST = 10
SCORE_MIN          = 50


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
    contratos = fetch_all(client, "contratos", "rfc,institucion,tipo_procedimiento,monto,fecha_inicio")
    print(f"  {len(contratos):,} contratos")

    # Percentil 40 de monto sobre TODOS los contratos
    montos = [float(r["monto"]) for r in contratos if r.get("monto") is not None]
    montos.sort()
    p40_idx = int(len(montos) * 0.40)
    p40_monto = montos[p40_idx] if montos else 0
    print(f"  Percentil 40 de monto: ${p40_monto:,.0f}")

    # Agrupar adjudicaciones directas por (rfc, institucion, anio)
    grupos: dict[tuple[str, str, str], list[float]] = {}
    for row in contratos:
        rfc  = row.get("rfc")
        inst = row.get("institucion") or ""
        tipo = row.get("tipo_procedimiento") or ""
        if not rfc or "ADJUDIC" not in tipo.upper():
            continue
        # Extraer año de fecha_inicio (soporta formatos DD/MM/YYYY y YYYY-MM-DD)
        fecha = row.get("fecha_inicio") or ""
        if "/" in fecha:
            partes = fecha.split("/")
            anio = partes[-1][:4] if len(partes) >= 3 else ""
        elif "-" in fecha:
            anio = fecha[:4]
        else:
            anio = ""
        if not anio.isdigit():
            continue
        key = (rfc, inst, anio)
        grupos.setdefault(key, []).append(float(row.get("monto") or 0))

    # Criterios 1+2+3: >=10 adj directas, misma institucion, mismo año, monto promedio < p40
    rfcs_fraccionados = set()
    for (rfc, inst, anio), montos_grupo in grupos.items():
        if len(montos_grupo) < MIN_ADJ_MISMA_INST:
            continue
        if (sum(montos_grupo) / len(montos_grupo)) >= p40_monto:
            continue
        rfcs_fraccionados.add(rfc)

    print(f"  {len(rfcs_fraccionados):,} RFCs con patron de fraccionamiento")

    print("Descargando proveedores...")
    proveedores = fetch_all(client, "proveedores", "rfc,nombre,score,total_contratos")
    print(f"  {len(proveedores):,} proveedores")

    # Criterio 4: score >= SCORE_MIN
    fraccionados = [
        p for p in proveedores
        if p["rfc"] in rfcs_fraccionados and (p.get("score") or 0) >= SCORE_MIN
    ]
    print(f"  {len(fraccionados):,} proveedores con flag_fraccionamiento (score >= {SCORE_MIN})")

    if not fraccionados:
        print("No se encontraron casos de fraccionamiento.")
        return

    # Actualizar flag_fraccionamiento en lotes de 50
    rfcs = [p["rfc"] for p in fraccionados]
    BATCH = 50
    updated = 0
    for i in range(0, len(rfcs), BATCH):
        chunk = rfcs[i : i + BATCH]
        client.table("proveedores").update({"flag_fraccionamiento": True}).in_("rfc", chunk).execute()
        updated += len(chunk)

    print(f"\n{updated} proveedores actualizados con flag_fraccionamiento = true\n")
    print("Proveedores con fraccionamiento detectado:")
    for p in sorted(fraccionados, key=lambda x: x.get("score") or 0, reverse=True):
        print(f"  {p['nombre']} | {p['rfc']} | score: {p.get('score', 0)} | contratos: {p.get('total_contratos', '?')}")


if __name__ == "__main__":
    main()
