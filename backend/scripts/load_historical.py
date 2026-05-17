import os
import math
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
BATCH_SIZE   = 50

BASE_DIR = Path(__file__).parent.parent.parent / "src" / "documentos-y-contratos"

FILES = [
    "contratos_compranet_2020.csv",
    "contratos_compranet_2021.csv",
    "contratos_compranet_2022.csv",
    "contratos_compranet_2023.csv",
    "contratos_compranet_2024.csv",
    "contratos_comprasmx_2025.csv",
    "contratos_comprasmx_2026.csv",
    "Contratos_CompraNet5.csv",
    "Contratos2020_241106100537.csv",
    "Contratos2021_241102110130.csv",
    "Contratos2022_2310241123-2.csv",
]

# Schema A (73 cols): contratos_compranet_* / contratos_comprasmx_*
# Detectado por la presencia de la columna "Importe DRC"
COLS_A = {
    "rfc":                "rfc",
    "proveedor":          "Proveedor o contratista",
    "institucion":        "Institucion",           # latin-1: Institución → Institucion al leer
    "monto":              "Importe DRC",
    "tipo_procedimiento": "Tipo Procedimiento",
    "fecha_inicio":       "Fecha de inicio del contrato",
    "fecha_fin":          "Fecha de fin del contrato",
    "num_contrato":       "Num. del contrato",     # latin-1: Núm. → Num.
    "titulo":             "Titulo del contrato",   # latin-1: Título → Titulo
    "orden_gobierno":     "Orden de gobierno",
    "descripcion_ramo":   "Descripcion Ramo",      # latin-1: Descripción → Descripcion
}

# Schema B (45 cols): Contratos_CompraNet5 / Contratos202x_*
# Detectado por la presencia de "Importe del contrato"
COLS_B = {
    "rfc":                "RFC",
    "proveedor":          "Proveedor o contratista",
    "institucion":        "Institucion",
    "monto":              "Importe del contrato",
    "tipo_procedimiento": "Tipo de procedimiento",
    "fecha_inicio":       "Fecha de inicio del contrato",
    "fecha_fin":          "Fecha de fin del contrato",
    "num_contrato":       "Num. de control del contrato",
    "titulo":             "Titulo del contrato",
    "orden_gobierno":     "Orden de gobierno",
    "descripcion_ramo":   None,
}


def read_csv(path: Path) -> pd.DataFrame:
    for enc in ("latin-1", "utf-8", "utf-8-sig"):
        try:
            return pd.read_csv(path, encoding=enc, dtype=str, low_memory=False)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"No se pudo leer {path.name}")


def normalize(s: str) -> str:
    """Quita acentos y pasa a minusculas para comparar columnas."""
    replacements = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U",
        "ü": "u", "Ü": "U", "ñ": "n", "Ñ": "N",
        "\xf3": "o", "\xe9": "e", "\xfa": "u", "\xed": "i", "\xe1": "a",
        "\xc3\xb3": "o",
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    return s.strip().lower()


def find_col(df: pd.DataFrame, target: str) -> str | None:
    """Busca una columna por nombre normalizado."""
    norm_target = normalize(target)
    for col in df.columns:
        if normalize(col) == norm_target:
            return col
    return None


def apply_schema(df: pd.DataFrame, schema: dict) -> pd.DataFrame:
    rename = {}
    for dest, src in schema.items():
        if src is None:
            continue
        match = find_col(df, src)
        if match:
            rename[match] = dest

    df = df.rename(columns=rename)
    present = [k for k, v in schema.items() if v is not None and k in df.columns]
    df = df[present].copy()

    for col in schema:
        if col not in df.columns:
            df[col] = None

    return df


def main():
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    seen_keys: set = set()
    grand_total = 0

    for filename in FILES:
        path = BASE_DIR / filename
        if not path.exists():
            print(f"ADVERTENCIA: {filename} no encontrado, omitiendo.")
            continue

        print(f"\nLeyendo {filename}...")
        df = read_csv(path)

        cols_lower = {normalize(c) for c in df.columns}
        schema = COLS_A if "importe drc" in cols_lower else COLS_B
        df = apply_schema(df, schema)

        df["monto"] = pd.to_numeric(df["monto"], errors="coerce").fillna(0)

        # Filtrar: solo contratos con monto sobre la mediana del archivo
        total_rows = len(df)
        mediana = df["monto"].median()
        df = df[df["monto"] > mediana].copy()
        # Cap de 5,000 filas — ordenado descendente para priorizar los de mayor valor
        if len(df) > 5000:
            df = df.nlargest(5000, "monto")
        selected_rows = len(df)
        skipped_filter = total_rows - selected_rows
        print(f"  Total en archivo: {total_rows:,} | Seleccionados (monto > mediana): {selected_rows:,} | Omitidos: {skipped_filter:,}")

        # Dedup entre archivos por (rfc, fecha_inicio, monto)
        df["_key"] = (
            df["rfc"].fillna("").str.strip().str.upper()
            + "|" + df["fecha_inicio"].fillna("")
            + "|" + df["monto"].astype(str)
        )
        before = len(df)
        df = df[~df["_key"].isin(seen_keys)]
        seen_keys.update(df["_key"].tolist())
        df = df.drop(columns=["_key"])
        skipped = before - len(df)

        # Dedup dentro del mismo archivo antes de insertar
        before_intra = len(df)
        df = df.drop_duplicates()
        intra_dupes = before_intra - len(df)

        df = df.where(pd.notna(df), other=None)

        total_batches = math.ceil(len(df) / BATCH_SIZE) if len(df) > 0 else 0
        file_inserted = 0
        file_skipped  = 0

        print(f"  {len(df):,} filas ({skipped:,} inter-archivo + {intra_dupes:,} intra-archivo omitidos)")

        for i in range(total_batches):
            batch = df.iloc[i * BATCH_SIZE: (i + 1) * BATCH_SIZE].to_dict(orient="records")
            try:
                client.table("contratos").upsert(
                    batch, on_conflict="num_contrato"
                ).execute()
                file_inserted += len(batch)
            except Exception:
                # Batch fallo: insertar fila por fila para no perder datos validos
                for row in batch:
                    try:
                        client.table("contratos").upsert(
                            [row], on_conflict="num_contrato"
                        ).execute()
                        file_inserted += 1
                    except Exception:
                        file_skipped += 1

            if (i + 1) % 10 == 0 or (i + 1) == total_batches:
                print(f"  Batch {i+1}/{total_batches} — {file_inserted:,} insertadas, {file_skipped} omitidas")

        grand_total += file_inserted
        print(f"  {filename}: {file_inserted:,} filas insertadas correctamente" +
              (f", {file_skipped} filas con conflicto omitidas" if file_skipped else ""))

    print(f"\nTotal historico insertado: {grand_total:,} filas")


if __name__ == "__main__":
    main()
