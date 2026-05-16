import os
import math
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
CSV_PATH     = Path(__file__).parent.parent / "data" / "contratos_clean.csv"
BATCH_SIZE   = 500

def main():
    print(f"Leyendo {CSV_PATH.name}...")
    df = pd.read_csv(CSV_PATH, dtype=str)
    df["monto"] = pd.to_numeric(df["monto"], errors="coerce").fillna(0)
    # Reemplazar NaN con None para que Supabase los acepte como NULL
    df = df.where(pd.notna(df), other=None)
    print(f"  {len(df):,} filas cargadas")

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    total_batches = math.ceil(len(df) / BATCH_SIZE)
    total_inserted = 0
    errors = []

    for i in range(total_batches):
        batch_df  = df.iloc[i * BATCH_SIZE : (i + 1) * BATCH_SIZE]
        batch     = batch_df.to_dict(orient="records")

        try:
            client.table("contratos").upsert(
                batch,
                on_conflict="num_contrato",
            ).execute()
            total_inserted += len(batch)
            print(f"  Inserted batch {i + 1}/{total_batches}, total {total_inserted:,} rows")
        except Exception as e:
            errors.append({"batch": i + 1, "error": str(e)})
            print(f"  ERROR en batch {i + 1}: {e}")

    print(f"\nTotal insertado: {total_inserted:,} filas")
    if errors:
        print(f"Errores ({len(errors)}):")
        for err in errors:
            print(f"  Batch {err['batch']}: {err['error']}")
    else:
        print("Sin errores.")

if __name__ == "__main__":
    main()
