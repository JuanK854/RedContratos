import pandas as pd
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
CSV_IN  = ROOT / "src" / "documentos-y-contratos" / "contratos_comprasmx_2026.csv"
CSV_OUT = Path(__file__).parent.parent / "data" / "contratos_clean.csv"

COLUMN_MAP = {
    "rfc":                       "rfc",
    "Proveedor o contratista":   "proveedor",
    "Institución":               "institucion",
    "Importe DRC":               "monto",
    "Tipo Procedimiento":        "tipo_procedimiento",
    "Fecha de inicio del contrato": "fecha_inicio",
    "Fecha de fin del contrato":    "fecha_fin",
    "Orden de gobierno":         "orden_gobierno",
    "Descripción Ramo":          "descripcion_ramo",
}

def main():
    print(f"Leyendo {CSV_IN.name}...")
    df = pd.read_csv(CSV_IN, encoding="latin-1", low_memory=False)
    print(f"  {len(df):,} filas, {len(df.columns)} columnas")

    df = df[list(COLUMN_MAP.keys())].rename(columns=COLUMN_MAP)

    before = len(df)
    df = df.dropna(subset=["rfc", "proveedor"])
    df = df[df["rfc"].str.strip().ne("") & df["proveedor"].str.strip().ne("")]
    print(f"  {before - len(df):,} filas eliminadas por rfc/proveedor vacíos")

    df["monto"] = pd.to_numeric(
        df["monto"].astype(str).str.replace(",", "", regex=False),
        errors="coerce"
    ).fillna(0)

    CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CSV_OUT, index=False, encoding="utf-8")
    print(f"  OK: {len(df):,} filas guardadas en {CSV_OUT}")

if __name__ == "__main__":
    main()
