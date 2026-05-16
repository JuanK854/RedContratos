# RedContratos

Herramienta de visualización de grafos para detectar redes de corrupción en contratos públicos del gobierno mexicano, usando datos reales de CompraNet.

Proyecto desarrollado para **hack@latam 2026** — track Transparency & Corruption.

---

## Requisitos

- Node.js 18+
- Python 3.11+
- Cuenta en [Supabase](https://supabase.com) con las tablas creadas (ver schema)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/JuanK854/RedContratos.git
cd RedContratos
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_anon_key
```

### 3. Frontend

```bash
npm install
npm run dev
```

### 4. Backend

```bash
pip install -r backend/requirements.txt
```

### 5. Base de datos

Ejecuta `backend/schema.sql` en el SQL Editor de Supabase para crear las tablas.

---

## Dependencias principales

### Frontend

| Paquete | Uso |
|---|---|
| `next` 16 + `react` 19 | Framework principal |
| `tailwindcss` 4 | Estilos |
| `react-force-graph-2d` | Grafo interactivo |
| `d3` | Motor de física del grafo |
| `lucide-react` | Iconos |
| `clsx` / `tailwind-merge` / `class-variance-authority` | Utilidades de clases (base shadcn/ui) |
| `@radix-ui/react-slot` | Primitivos de UI |

### Backend

| Paquete | Uso |
|---|---|
| `fastapi` | API REST |
| `uvicorn` | Servidor ASGI |
| `supabase` | Cliente Python para Supabase |
| `python-dotenv` | Leer variables de entorno |
| `pandas` | Limpieza y procesamiento del CSV |

---

## Scripts de datos

```bash
# 1. Limpiar el CSV original
python backend/scripts/clean_csv.py

# 2. Verificar conexión a Supabase y que las tablas existan
python backend/create_tables.py

# 3. Cargar contratos limpios en Supabase (upsert por num_contrato, lotes de 500)
python backend/scripts/load_to_supabase.py

# 4. Calcular proveedores únicos con scoring y cargarlos en Supabase
python backend/scripts/build_proveedores.py
```

El CSV fuente debe estar en `src/documentos-y-contratos/contratos_comprasmx_2026.csv` (encoding latin-1).  
El CSV limpio se genera en `backend/data/` (ignorado por git).

> **Nota:** El campo `num_contrato` tiene restricción `UNIQUE` en la tabla `contratos`. Si re-ejecutas `load_to_supabase.py`, las filas existentes se actualizan en lugar de duplicarse.

---

## Estructura del proyecto

```
RedContratos/
├── src/                        # Frontend Next.js
│   └── documentos-y-contratos/ # CSVs originales (no se suben al repo)
├── backend/
│   ├── schema.sql              # Definición de tablas Supabase
│   ├── create_tables.py        # Verifica conexión y tablas
│   ├── requirements.txt        # Dependencias Python
│   ├── scripts/
│   │   └── clean_csv.py        # Limpieza del CSV fuente
│   └── data/                   # CSVs procesados (ignorado por git)
├── .env                        # Variables de entorno (ignorado por git)
└── CLAUDE.md                   # Contexto del proyecto para asistentes IA
```

---

## Stack completo

- **Frontend:** Next.js 16 + Tailwind + shadcn/ui + react-force-graph-2d
- **Backend:** FastAPI + Uvicorn (deploy en Railway)
- **Base de datos:** Supabase (PostgreSQL)
- **IA:** Magistral Medium via OpenRouter
- **Alertas:** Zavu API (WhatsApp cuando score > 80)
- **Deploy frontend:** Vercel
