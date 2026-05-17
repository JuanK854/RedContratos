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

def compute_score(row, p90_monto_promedio):
    score = 0
    if row["num_dependencias"] > 50:
        score += 40
    if row["pct_adjudicacion_directa"] > 80:
        score += 30
    if row["total_contratos"] > 100:
        score += 20
    if row["total_monto"] > 1_000_000_000:
        score += 10
    if row["monto_promedio"] > p90_monto_promedio:
        score += 20
    if row["velocidad_sospechosa"]:
        score += 15
    return min(score, 100)

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

    # --- Variables adicionales para el score ---

    # 1. Monto promedio por contrato
    proveedores["monto_promedio"] = proveedores["total_monto"] / proveedores["total_contratos"]
    p90_monto_promedio = proveedores["monto_promedio"].quantile(0.90)

    # 2. Velocidad de adjudicacion: crecimiento >300% YoY con presencia en multiples años
    df["anio"] = pd.to_datetime(df["fecha_inicio"], errors="coerce").dt.year
    yearly = df.groupby(["rfc", "anio"]).size().reset_index(name="n")

    def max_yoy_growth(group):
        counts = group.sort_values("anio")["n"].values
        max_growth = 0.0
        for i in range(1, len(counts)):
            if counts[i - 1] > 0:
                growth = (counts[i] - counts[i - 1]) / counts[i - 1] * 100
                max_growth = max(max_growth, growth)
        return max_growth

    yoy = yearly.groupby("rfc").apply(max_yoy_growth).rename("max_yoy")
    proveedores = proveedores.merge(yoy, on="rfc", how="left")
    proveedores["max_yoy"] = proveedores["max_yoy"].fillna(0)

    years_per_rfc = df.dropna(subset=["anio"]).groupby("rfc")["anio"].apply(set).rename("anios")
    proveedores = proveedores.merge(years_per_rfc, on="rfc", how="left")

    proveedores["velocidad_sospechosa"] = (
        proveedores["anios"].apply(lambda s: isinstance(s, set) and len(s) > 1)
        & (proveedores["max_yoy"] > 300)
    )

    # --- Score final ---
    proveedores["score"] = proveedores.apply(
        lambda row: compute_score(row, p90_monto_promedio), axis=1
    )
    proveedores["flag_fantasma"]        = False
    proveedores["flag_fraccionamiento"] = False
    proveedores["flag_espejo"]          = False

    proveedores["total_monto"] = proveedores["total_monto"].round(2)

    # Distribucion de scores
    bins   = [0, 25, 50, 75, 100]
    labels = ["0-25", "26-50", "51-75", "76-100"]
    dist = pd.cut(proveedores["score"], bins=bins, labels=labels, include_lowest=True).value_counts().sort_index()
    print("\nDistribucion de scores:")
    for rango, count in dist.items():
        print(f"  {rango}: {count:,} proveedores")

    # Quitar columnas temporales antes de guardar
    cols_temp = ["monto_promedio", "max_yoy", "anios", "velocidad_sospechosa"]
    proveedores.drop(columns=[c for c in cols_temp if c in proveedores.columns], inplace=True)

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
