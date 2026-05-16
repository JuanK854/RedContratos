import os
import math
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
CSV_IN       = Path(__file__).parent.parent / "data" / "contratos_clean.csv"
CSV_OUT      = Path(__file__).parent.parent / "data" / "conexiones_clean.csv"
BATCH_SIZE   = 500

def main():
    print(f"Leyendo {CSV_IN.name}...")
    df = pd.read_csv(CSV_IN, dtype=str)
    df["monto"] = pd.to_numeric(df["monto"], errors="coerce").fillna(0)
    print(f"  {len(df):,} contratos")

    print("Agrupando por rfc + institucion...")
    nombre_por_rfc = (
        df.groupby("rfc")["proveedor"]
        .agg(lambda x: x.value_counts().idxmax())
        .rename("nombre_proveedor")
    )

    conexiones = (
        df.groupby(["rfc", "institucion"])
        .agg(
            num_contratos=("rfc", "count"),
            monto_total=("monto", "sum"),
        )
        .reset_index()
        .rename(columns={"rfc": "rfc_proveedor"})
    )

    conexiones = conexiones.merge(nombre_por_rfc, left_on="rfc_proveedor", right_index=True)
    conexiones["monto_total"] = conexiones["monto_total"].round(2)
    conexiones = conexiones[
        ["rfc_proveedor", "nombre_proveedor", "institucion", "num_contratos", "monto_total"]
    ]

    CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    conexiones.to_csv(CSV_OUT, index=False, encoding="utf-8")
    print(f"  {len(conexiones):,} conexiones guardadas en {CSV_OUT.name}")

    print("Conectando a Supabase...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    records       = conexiones.where(pd.notna(conexiones), other=None).to_dict(orient="records")
    total_batches = math.ceil(len(records) / BATCH_SIZE)
    total_upserted = 0
    errors = []

    for i in range(total_batches):
        batch = records[i * BATCH_SIZE : (i + 1) * BATCH_SIZE]
        try:
            client.table("conexiones").upsert(
                batch, on_conflict="rfc_proveedor,institucion"
            ).execute()
            total_upserted += len(batch)
            print(f"  Inserted batch {i + 1}/{total_batches}, total {total_upserted:,} rows")
        except Exception as e:
            errors.append({"batch": i + 1, "error": str(e)})
            print(f"  ERROR en batch {i + 1}: {e}")

    print(f"\nTotal conexiones insertadas: {total_upserted:,}")
    if errors:
        print(f"Errores ({len(errors)}):")
        for err in errors:
            print(f"  Batch {err['batch']}: {err['error']}")
    else:
        print("Sin errores.")

if __name__ == "__main__":
    main()
