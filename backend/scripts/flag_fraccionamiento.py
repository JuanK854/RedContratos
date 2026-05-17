import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

PAGE_SIZE       = 1000
MIN_ADJ_MISMA_INST = 10   # contratos de adjudicacion directa en la misma institucion


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
    contratos = fetch_all(client, "contratos", "rfc,institucion,tipo_procedimiento")
    print(f"  {len(contratos):,} contratos")

    # Contar adjudicaciones directas por (rfc, institucion)
    conteo: dict[tuple[str, str], int] = {}
    for row in contratos:
        rfc = row.get("rfc")
        inst = row.get("institucion") or ""
        tipo = row.get("tipo_procedimiento") or ""
        if not rfc:
            continue
        if "ADJUDIC" in tipo.upper():
            key = (rfc, inst)
            conteo[key] = conteo.get(key, 0) + 1

    # RFCs con >= MIN_ADJ_MISMA_INST adjudicaciones directas en una misma institucion
    rfcs_fraccionados = {
        rfc
        for (rfc, inst), n in conteo.items()
        if n >= MIN_ADJ_MISMA_INST
    }
    print(f"  {len(rfcs_fraccionados):,} RFCs con fraccionamiento (>={MIN_ADJ_MISMA_INST} adj. directas en misma institucion)")

    print("Descargando proveedores...")
    proveedores = fetch_all(client, "proveedores", "rfc,nombre,score,total_contratos")
    print(f"  {len(proveedores):,} proveedores")

    fraccionados = [
        p for p in proveedores
        if p["rfc"] in rfcs_fraccionados
    ]
    print(f"  {len(fraccionados):,} proveedores con flag_fraccionamiento")

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

    print(f"\n✅ {updated} proveedores actualizados con flag_fraccionamiento = true\n")
    print("Proveedores con fraccionamiento detectado:")
    for p in sorted(fraccionados, key=lambda x: x.get("total_contratos") or 0, reverse=True):
        print(f"   [F] {p['nombre']} — {p['rfc']} — score: {p.get('score', 0)} — contratos: {p.get('total_contratos', '?')}")


if __name__ == "__main__":
    main()
