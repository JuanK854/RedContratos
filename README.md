# RedContratos

Plataforma de inteligencia anticorrupción para visualizar redes de contratistas y detectar patrones de fraude en los contratos públicos del gobierno federal mexicano.

**Demo:** https://redcontratos.vercel.app · **API:** https://redcontratos-production.up.railway.app

---

## Qué hace

RedContratos cruza automáticamente los 34,486 contratos del dataset CompraNet 2026 y los convierte en un grafo interactivo donde cada nodo es un proveedor o institución y cada arista representa contratos entre ellos. El sistema calcula un score de riesgo 0–100 por proveedor y detecta tres tipos de fraude sin intervención humana.

El 76% de los contratos del gobierno federal mexicano en 2026 fueron adjudicados directamente —sin licitación pública. RedContratos hace esa opacidad visible.

---

## Características

### Explorador de Grafos
- Búsqueda en tiempo real por nombre de empresa, RFC o dependencia gubernamental
- Visualización de red con física simulada (force-directed graph)
- Nodos coloreados por tipo: proveedor (azul), institución (rojo), empresa fantasma (verde)
- Panel lateral con detalle al hacer click en cualquier nodo
- Zoom, arrastre y navegación libre del grafo

### Detección Automática de Fraude

**Empresa Fantasma**
Proveedores sin contratos registrados en años anteriores (2020–2024) que en 2026 recibieron millones en adjudicaciones directas bajo esquemas de "emergencia" o "seguridad nacional". El sistema los identifica comparando su historial contra el dataset histórico acumulado.

**Fraccionamiento**
Un mismo RFC recibe múltiples contratos de monto mínimo con la misma institución dentro del mismo periodo. Esta práctica fragmenta un gasto mayor para evadir el umbral que obligaría a licitación pública. Ejemplo documentado: Daniel Charis Carrasco — 42 contratos de ~$2,433 MXN cada uno, todos adjudicación directa, misma dependencia (INDAABIN).

**Contrato Espejo**
Renovaciones automáticas opacas bajo la fórmula "adjudicación a proveedor con contrato vigente, bajo las mismas condiciones", sin abrir un nuevo proceso competitivo ni requerir inscripción en el RUPC. Ejemplo documentado: Almacenaje y Distribución AVIOR — $1,302 millones con BIRMEX, sin licitación y sin registro en el padrón oficial.

### Score de Riesgo (0–100)
Calculado por el backend para cada proveedor con base en:
- Número de dependencias gubernamentales distintas con las que contrata
- Porcentaje de contratos por adjudicación directa vs licitación pública
- Presencia de flags de fraude activos (fantasma, fraccionamiento, espejo)
- Concentración de monto relativa al total del dataset

| Score | Nivel |
|---|---|
| 0–39 | Bajo |
| 40–69 | Moderado |
| 70–89 | Alto |
| 90–100 | Crítico |

### Análisis con IA
En la página de detalle de cada proveedor (`/caso/:rfc`), el botón "Analizar Red" genera un párrafo en español explicando por qué la red es sospechosa, usando el modelo **Mistral Small 3.2** vía OpenRouter. El análisis está dirigido a ciudadanos y periodistas, usa los datos reales del caso (monto, dependencias, tipo de fraude, score) y se produce en segundos.

### Alertas por Telegram
Desde `/alertas`, cualquier usuario puede ingresar su ID de Telegram y recibir notificaciones de todos los proveedores con score ≥ 70, incluyendo nombre, RFC, tipo de fraude y monto involucrado. El sistema usa **Zavu API** como canal de mensajería.

---

## Arquitectura

```
CompraNet CSV (datos.gob.mx)
        ↓
   Make.com (ETL sin código)
        ↓
   Supabase (PostgreSQL)
   ┌──────┬──────┬──────────┐
contratos  proveedores  conexiones
        ↓
   FastAPI — Railway
   /search  /graph  /top-sospechosos  /stats  /alertas  /contratos/:rfc
        ↓
   Next.js 16 — Vercel
   react-force-graph-2d · shadcn/ui · Tailwind CSS
        ↓
   OpenRouter (Mistral Small 3.2)      Zavu API (Telegram)
   /api/analizar-red                   /api/analizar
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + Tailwind CSS + shadcn/ui |
| Grafo interactivo | react-force-graph-2d + D3 |
| Backend | FastAPI (Python) |
| Base de datos | Supabase (PostgreSQL) |
| IA | Mistral Small 3.2 vía OpenRouter |
| Notificaciones | Zavu API (Telegram) |
| ETL | Make.com |
| Deploy frontend | Vercel |
| Deploy backend | Railway |

---

## Rutas del Frontend

| Ruta | Descripción |
|---|---|
| `/` | Landing con estadísticas animadas del dataset |
| `/explorador` | Grafo interactivo con buscador |
| `/top` | Top 20 proveedores por score de riesgo |
| `/alertas` | Dashboard de casos detectados automáticamente |
| `/caso/:rfc` | Detalle de proveedor: flags, contratos, análisis IA |
| `/contratos/:rfc` | Lista completa de contratos de un RFC |

---

## API Reference

Base URL: `https://redcontratos-production.up.railway.app`

### `GET /search`
Busca proveedores por nombre o RFC.

**Query params:** `q` — texto a buscar (mínimo 3 caracteres)

```json
{
  "results": [
    {
      "rfc": "EME980311H54",
      "nombre": "EDENRED MEXICO SA DE CV",
      "score": 92,
      "flag_fantasma": false,
      "flag_fraccionamiento": true,
      "flag_espejo": false
    }
  ]
}
```

---

### `GET /graph`
Devuelve nodos y aristas del grafo para un proveedor.

**Query params:** `rfc` — RFC del proveedor

```json
{
  "nodes": [
    {
      "id": "EME980311H54",
      "name": "EDENRED MEXICO SA DE CV",
      "group": "proveedor",
      "score": 92,
      "flags": { "fantasma": false, "fraccionamiento": true, "espejo": false }
    },
    {
      "id": "SECRETARIA DE HACIENDA",
      "name": "SECRETARIA DE HACIENDA",
      "group": "institucion"
    }
  ],
  "links": [
    {
      "source": "EME980311H54",
      "target": "SECRETARIA DE HACIENDA",
      "num_contratos": 14,
      "monto_total": 320000000
    }
  ]
}
```

---

### `GET /top-sospechosos`
Top 20 proveedores ordenados por score descendente.

```json
{
  "top_sospechosos": [
    {
      "rfc": "EME980311H54",
      "nombre": "EDENRED MEXICO SA DE CV",
      "score": 95,
      "total_monto": 6894022920,
      "num_dependencias": 215,
      "total_contratos": 439,
      "flag_fantasma": false,
      "flag_fraccionamiento": true,
      "flag_espejo": false
    }
  ]
}
```

---

### `GET /alertas`
Lista de todos los proveedores con al menos un flag de fraude activo.

```json
{
  "alertas": [
    {
      "rfc": "AAD960401AB3",
      "nombre": "ALMACENAJE Y DISTRIBUCION AVIOR SA DE CV",
      "score": 87,
      "monto_involucrado": 1302000000,
      "tipos_fraude": ["Contrato Espejo"]
    }
  ]
}
```

---

### `GET /stats`
Totales globales del dataset.

```json
{
  "total_contratos": 34486,
  "monto_total": 300000000000,
  "porcentaje_opacidad": 76,
  "total_proveedores": 4821
}
```

---

### `GET /contratos/{rfc}`
Lista de contratos individuales de un proveedor.

```json
{
  "contratos": [
    {
      "num_contrato": "LA-006HJY001-E9-2026",
      "institucion": "BIRMEX",
      "tipo_procedimiento": "Adjudicación Directa",
      "monto": 1302000000,
      "fecha_inicio": "2026-01-15",
      "fecha_fin": "2026-12-31"
    }
  ]
}
```

---

## Variables de Entorno

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=https://redcontratos-production.up.railway.app
OPENROUTER_API_KEY=sk-or-...
ZAVU_API_KEY=...
ZAVU_SENDER_ID=...
```

### Backend — Railway

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJ...
```

---

## Correr localmente

```bash
# Clonar el repositorio
git clone https://github.com/JuanK854/RedContratos.git
cd RedContratos

# Instalar dependencias del frontend
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

El backend (FastAPI) se despliega por separado en Railway. Por defecto el frontend apunta a la instancia de producción en Railway; puedes cambiar `NEXT_PUBLIC_API_URL` en `.env.local` para apuntar a una instancia local.

---

## Pipeline de Datos

Los scripts de Python en `backend/scripts/` procesan el CSV fuente y cargan los datos en Supabase:

```bash
# 1. Limpiar el CSV original (encoding latin-1 → utf-8, normalización de columnas)
python backend/scripts/clean_csv.py

# 2. Cargar contratos en Supabase (upsert por num_contrato, lotes de 500 filas)
python backend/scripts/load_to_supabase.py

# 3. Calcular proveedores únicos con scoring y flags de fraude
python backend/scripts/build_proveedores.py

# 4. Construir tabla de conexiones proveedor→institución para el grafo
python backend/scripts/build_conexiones.py
```

El CSV fuente debe estar en `src/documentos-y-contratos/contratos_comprasmx_2026.csv`.

---

## Schema de Base de Datos

```sql
-- Contratos individuales
create table contratos (
  id serial primary key,
  rfc text,
  proveedor text,
  institucion text,
  monto numeric,
  tipo_procedimiento text,
  fecha_inicio text,
  fecha_fin text,
  num_contrato text unique,
  titulo text,
  orden_gobierno text,
  descripcion_ramo text
);

-- Proveedores con scoring y flags de fraude
create table proveedores (
  rfc text primary key,
  nombre text,
  total_contratos int,
  total_monto numeric,
  num_dependencias int,
  pct_adjudicacion_directa numeric,
  score int,
  flag_fantasma boolean default false,
  flag_fraccionamiento boolean default false,
  flag_espejo boolean default false
);

-- Conexiones para el grafo (proveedor → institución)
create table conexiones (
  id serial primary key,
  rfc_proveedor text,
  nombre_proveedor text,
  institucion text,
  num_contratos int,
  monto_total numeric
);
```

---

## Casos Documentados

| Proveedor | Dependencias | Monto | Flag |
|---|---|---|---|
| EDENRED MEXICO SA DE CV | 215 | $6.9B MXN | Fraccionamiento |
| AGROASEMEX SA | 195 | $6.6B MXN | Concentración |
| JET VAN CAR RENTAL SA DE CV | 38 | $2.9B MXN | Concentración |
| ALMACENAJE Y DISTRIBUCION AVIOR | 1 (BIRMEX) | $1.3B MXN | Contrato Espejo |
| DANIEL CHARIS CARRASCO | 1 (INDAABIN) | ~$102K MXN | Fraccionamiento (42 contratos) |

---

## Dependencias Frontend

| Paquete | Uso |
|---|---|
| `next` 16 | Framework React |
| `react-force-graph-2d` | Grafo interactivo |
| `d3` | Motor de física |
| `tailwindcss` 4 | Estilos |
| `lucide-react` | Iconos |
| `@radix-ui/*` | Primitivos de UI accesibles |
| `class-variance-authority` + `clsx` | Utilidades de clases |
| `@zavudev/sdk` | Cliente Zavu (Telegram) |

## Dependencias Backend

| Paquete | Uso |
|---|---|
| `fastapi` | API REST |
| `uvicorn` | Servidor ASGI |
| `supabase` | Cliente Python |
| `pandas` | Procesamiento de CSV |
| `python-dotenv` | Variables de entorno |

---

## Estructura del Proyecto

```
RedContratos/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing
│   │   ├── explorador/           # Grafo interactivo
│   │   ├── top/                  # Ranking de riesgo
│   │   ├── alertas/              # Dashboard de alertas
│   │   ├── caso/[rfc]/           # Detalle de proveedor
│   │   ├── contratos/[rfc]/      # Lista de contratos
│   │   └── api/
│   │       ├── analizar/         # Endpoint alertas Telegram
│   │       └── analizar-red/     # Endpoint análisis IA
│   ├── components/
│   │   ├── navbar.tsx            # Layout con sidebar
│   │   ├── buscador.tsx          # Búsqueda con debounce
│   │   ├── panel-detalle.tsx     # Panel lateral del grafo
│   │   ├── score-badge.tsx       # Badge de score coloreado
│   │   └── ui/                   # Componentes shadcn/ui
│   └── lib/
│       └── config.ts             # URL base de la API
├── backend/
│   ├── schema.sql
│   ├── requirements.txt
│   └── scripts/
│       ├── clean_csv.py
│       ├── load_to_supabase.py
│       ├── build_proveedores.py
│       └── build_conexiones.py
└── src/documentos-y-contratos/   # CSVs fuente (no versionados)
```

---

## Licencia

MIT

---

Construido en [hack@latam](https://indies.la) · Mayo 2026 · Chihuahua, México
