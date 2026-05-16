-- RedContratos: Schema de base de datos
-- Ejecutar en Supabase SQL Editor o via create_tables.py

-- Tabla principal de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id                 SERIAL PRIMARY KEY,
  rfc                TEXT,
  proveedor          TEXT,
  institucion        TEXT,
  monto              NUMERIC,
  tipo_procedimiento TEXT,
  fecha_inicio       TEXT,
  fecha_fin          TEXT,
  num_contrato       TEXT,
  titulo             TEXT,
  orden_gobierno     TEXT,
  descripcion_ramo   TEXT
);

-- Proveedores con scoring de sospecha
CREATE TABLE IF NOT EXISTS proveedores (
  rfc                      TEXT PRIMARY KEY,
  nombre                   TEXT,
  total_contratos          INT,
  total_monto              NUMERIC,
  num_dependencias         INT,
  pct_adjudicacion_directa NUMERIC,
  score                    INT,
  flag_fantasma            BOOLEAN DEFAULT FALSE,
  flag_fraccionamiento     BOOLEAN DEFAULT FALSE,
  flag_espejo              BOOLEAN DEFAULT FALSE
);

-- Conexiones proveedor-institución para el grafo
CREATE TABLE IF NOT EXISTS conexiones (
  id               SERIAL PRIMARY KEY,
  rfc_proveedor    TEXT,
  nombre_proveedor TEXT,
  institucion      TEXT,
  num_contratos    INT,
  monto_total      NUMERIC
);
