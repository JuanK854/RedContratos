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
CSV_OUT      = Path(__file__).parent.parent / "data" / "proveedores_clean.csv"
BATCH_SIZE   = 500

def compute_score(row):
    score = 0
    if row["num_dependencias"] > 50:
        score += 40
    if row["pct_adjudicacion_directa"] > 80:
        score += 30
    if row["total_contratos"] > 100:
        score += 20
    if row["total_monto"] > 1_000_000_000:
        score += 10
    return score

def main():
    print(f"Leyendo {CSV_IN.name}...")
    df = pd.read_csv(CSV_IN, dtype=str)
    df["monto"] = pd.to_numeric(df["monto"], errors="coerce").fillna(0)
    print(f"  {len(df):,} contratos")

    es_adjudicacion = df["tipo_procedimiento"].str.contains(
        "ADJUDICACI", case=False, na=False
    )

    print("Agrupando por RFC...")
    proveedores = df.groupby("rfc").agg(
        nombre                   = ("proveedor", lambda x: x.value_counts().idxmax()),
        total_contratos          = ("rfc", "count"),
        total_monto              = ("monto", "sum"),
        num_dependencias         = ("institucion", "nunique"),
    ).reset_index()

    adj_counts = df[es_adjudicacion].groupby("rfc").size().rename("adj_count")
    proveedores = proveedores.merge(adj_counts, on="rfc", how="left")
    proveedores["adj_count"] = proveedores["adj_count"].fillna(0)
    proveedores["pct_adjudicacion_directa"] = (
        proveedores["adj_count"] / proveedores["total_contratos"] * 100
    ).round(2)
    proveedores.drop(columns=["adj_count"], inplace=True)

    proveedores["score"]               = proveedores.apply(compute_score, axis=1)
    proveedores["flag_fantasma"]       = False
    proveedores["flag_fraccionamiento"] = False
    proveedores["flag_espejo"]         = False

    proveedores["total_monto"]  = proveedores["total_monto"].round(2)

    CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    proveedores.to_csv(CSV_OUT, index=False, encoding="utf-8")
    print(f"  {len(proveedores):,} proveedores guardados en {CSV_OUT.name}")

    print("Conectando a Supabase...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    records       = proveedores.where(pd.notna(proveedores), other=None).to_dict(orient="records")
    total_batches = math.ceil(len(records) / BATCH_SIZE)
    total_upserted = 0
    errors = []

    for i in range(total_batches):
        batch = records[i * BATCH_SIZE : (i + 1) * BATCH_SIZE]
        try:
            client.table("proveedores").upsert(batch, on_conflict="rfc").execute()
            total_upserted += len(batch)
            print(f"  Inserted batch {i + 1}/{total_batches}, total {total_upserted:,} rows")
        except Exception as e:
            errors.append({"batch": i + 1, "error": str(e)})
            print(f"  ERROR en batch {i + 1}: {e}")

    print(f"\nTotal proveedores insertados: {total_upserted:,}")
    if errors:
        print(f"Errores ({len(errors)}):")
        for err in errors:
            print(f"  Batch {err['batch']}: {err['error']}")
    else:
        print("Sin errores.")

if __name__ == "__main__":
    main()
