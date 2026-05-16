import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env")

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]

schema_path = Path(__file__).parent / "schema.sql"
sql = schema_path.read_text(encoding="utf-8")

client = create_client(url, key)

# Supabase JS client no expone ejecución directa de SQL arbitrario;
# usamos la extensión pg via postgrest RPC o la API de administración.
# La forma recomendada para DDL es ejecutar el schema.sql en el SQL Editor
# de Supabase. Este script valida la conexión y confirma que las tablas existen.

def check_tables():
    tables = ["contratos", "proveedores", "conexiones"]
    for table in tables:
        try:
            result = client.table(table).select("*").limit(1).execute()
            print(f"  ✓ {table} — ok")
        except Exception as e:
            print(f"  ✗ {table} — {e}")

if __name__ == "__main__":
    print("Conectando a Supabase...")
    print(f"  URL: {url[:40]}...")
    print("\nVerificando tablas:")
    check_tables()
    print("\nSi alguna tabla falla, ejecuta backend/schema.sql en el SQL Editor de Supabase.")
