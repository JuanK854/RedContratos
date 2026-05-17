import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

PAGE_SIZE = 1000

# Palabras clave en el titulo que delatan una renovacion opaca
KEYWORDS_ESPEJO = [
    "CONTRATO VIGENTE",
    "MISMAS CONDICIONES",
    "PROVEEDOR CON CONTRATO",
    "BAJO LAS MISMAS",
    "RENOVACION",
    "RENOVACIÓN",
    "EXTENSION",
    "EXTENSIÓN",
]


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


def es_espejo(titulo: str, tipo: str) -> bool:
    titulo_up = titulo.upper()
    tipo_up = tipo.upper()
    if "ADJUDIC" not in tipo_up:
        return False
    return any(kw in titulo_up for kw in KEYWORDS_ESPEJO)


def main():
    print("Conectando a Supabase...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Descargando contratos...")
    contratos = fetch_all(client, "contratos", "rfc,tipo_procedimiento,titulo")
    print(f"  {len(contratos):,} contratos")

    # RFCs con al menos 1 contrato espejo
    rfcs_espejo = set()
    for row in contratos:
        rfc = row.get("rfc")
        if not rfc:
            continue
        titulo = row.get("titulo") or ""
        tipo = row.get("tipo_procedimiento") or ""
        if es_espejo(titulo, tipo):
            rfcs_espejo.add(rfc)

    print(f"  {len(rfcs_espejo):,} RFCs con contratos espejo detectados")

    print("Descargando proveedores...")
    proveedores = fetch_all(client, "proveedores", "rfc,nombre,score,total_contratos")
    print(f"  {len(proveedores):,} proveedores")

    espejos = [
        p for p in proveedores
        if p["rfc"] in rfcs_espejo
    ]
    print(f"  {len(espejos):,} proveedores con flag_espejo")

    if not espejos:
        print("No se encontraron contratos espejo.")
        return

    rfcs = [p["rfc"] for p in espejos]
    BATCH = 50
    updated = 0
    for i in range(0, len(rfcs), BATCH):
        chunk = rfcs[i : i + BATCH]
        client.table("proveedores").update({"flag_espejo": True}).in_("rfc", chunk).execute()
        updated += len(chunk)

    print(f"\n✅ {updated} proveedores actualizados con flag_espejo = true\n")
    print("Proveedores con contratos espejo detectados:")
    for p in sorted(espejos, key=lambda x: x.get("score") or 0, reverse=True):
        print(f"   [E] {p['nombre']} — {p['rfc']} — score: {p.get('score', 0)} — contratos: {p.get('total_contratos', '?')}")


if __name__ == "__main__":
    main()
