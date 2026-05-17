@AGENTS.md

# 🕸️ RedContratos — Contexto Completo del Proyecto

> Documento de contexto para Claude u otros asistentes. No ejecutar ninguna acción, solo usar como referencia.

---

## 🏆 El Hackathon

**Nombre:** hack@latam by indies.la  
**Descripción:** La hackathon de impacto social más grande de LATAM. Lema: Tech for Good.  
**Fechas:** 15, 16 y 17 de mayo de 2026  
**Kick-off:** Jueves 15 de mayo a las 6pm (UTC-4)  
**Entrega final:** Domingo 17 de mayo a las 7pm  
**Formato:** Remoto + LAN parties presenciales  
**LAN Party del equipo:** Chihuahua, México — organizado por Escuelita Maker  
**Coordinación:** Discord en español  
**Participantes:** 150 en toda LATAM, equipos de 1–4 personas  
**Requisito obligatorio:** Todos los proyectos deben ser open source y estar deployados  

### Premios
- **$6,000 USD cash** dividido entre los 3 ganadores por track (1 ganador por track)
- **$45,000 USD en créditos** para todos los participantes
- Premio especial Mistral AI: $1,200 USD en créditos para los mejores usos de su tecnología
- Premio especial Make.com: 1 año de Make.com para el mejor uso
- Premio especial The Residency: entrevista para programa de 3 meses en San Francisco con demo day ante inversores de a16z, 1517 Fund, etc.
- Premio especial Antigravity (solo track DEF/ACC): programa Puentes, una semana en SF con la escena startup

### Tracks disponibles
1. **Transparency & Corruption** — herramientas para exponer corrupción en datos públicos ← **el equipo eligió este**
2. **Environment & Climate Risk** — monitoreo y predicción de daño ambiental
3. **DEF/ACC** — tecnologías defensivas contra ciberataques, desinformación, etc.

---

## 🕸️ El Proyecto: RedContratos

### ¿Qué es?
RedContratos es una herramienta web de visualización de grafos que detecta automáticamente redes de corrupción en contratos públicos del gobierno mexicano usando datos reales de CompraNet (portal oficial de compras del gobierno federal de México).

### ¿Por qué existe?
El gobierno mexicano publica sus contratos por ley en CompraNet, pero nadie los cruza ni analiza de forma visual. Si una empresa corrupta gana contratos en 15 dependencias distintas con distintos nombres pero el mismo dueño, nadie se da cuenta. RedContratos hace eso visible automáticamente.

### ¿Qué hace concretamente?
1. **Buscador** — escribes el nombre de una empresa, RFC o dependencia y aparecen sus conexiones
2. **Grafo interactivo** — visualización de red donde nodos = entidades (proveedores/instituciones) y aristas = contratos entre ellas
3. **Score de sospecha automático** — algoritmo 0–100 basado en número de dependencias distintas, porcentaje de adjudicaciones directas, y patrones anómalos
4. **Detección automática de 3 tipos de fraude:**
   - 🚩 **Empresas fantasma** — proveedores sin historial previo a 2026 que de repente reciben millones
   - 🚩 **Fraccionamiento** — mismo RFC con 10+ contratos en la misma institución para evadir licitación
   - 🚩 **Contratos espejo** — renovaciones automáticas opacas usando "contrato vigente" como justificación
5. **Página /alertas** — dashboard de casos detectados automáticamente, agrupados por tipo
6. **Explicación IA** — botón "Analizar Red" que genera un párrafo explicando por qué una red es sospechosa
7. **Alerta WhatsApp** — vía Zavu API cuando el score de un proveedor supera 80

### Diferenciadores vs competencia existente
Existen herramientas similares como QuiénEsQuién.wiki (PODER), TodosLosContratos.mx e IMCO IRC, pero:
- Están construidas sobre Kibana o dashboards técnicos difíciles para el ciudadano común
- No tienen visualización de grafo interactivo moderno
- RedContratos usa la API pública de QuiénEsQuién.wiki como fuente de datos adicional, construyendo encima la capa visual e inteligente que ellos no tienen

---

## 📊 Datos Reales Disponibles

### Dataset principal
- **Fuente:** CompraNet / comprasmx.buengobierno.gob.mx (portal oficial gobierno federal México)
- **Archivo:** `contratos_comprasmx_2026.csv`
- **Filas:** 34,486 contratos
- **Columnas:** 73 campos por contrato
- **Campos clave usados:** RFC, Proveedor o contratista, Institución, Importe DRC, Tipo Procedimiento, Fecha de inicio, Fecha de fin, Orden de gobierno, Descripción Ramo

### Casos reales ya identificados (para demo)

**Caso 1 — Concentración masiva:**
- EDENRED MEXICO SA DE CV: 439 contratos, **215 dependencias distintas**, $6,894,022,920 MXN
- AGROASEMEX SA: 251 contratos, 195 dependencias, $6,563,385,087 MXN
- JET VAN CAR RENTAL SA DE CV: 38 dependencias pero $2,869,495,915 MXN (casi 3 mil millones en renta de carros)

**Caso 2 — Empresas fantasma 2026:**
- Empresas como Slycom, Kol-Tov, Biometría Aplicada, José Safar Boueri
- Ninguna tenía UN SOLO contrato registrado en 2020, 2021 o 2022
- En 2026 recibieron miles de millones bajo esquemas de "emergencia y seguridad nacional"
- Adjudicación directa sin proceso competitivo

**Caso 3 — Contrato espejo BIRMEX:**
- Empresa: ALMACENAJE Y DISTRIBUCION AVIOR SA DE CV
- Dependencia: BIRMEX (Laboratorios de Biológicos y Reactivos de México)
- Monto: $1,302 millones de pesos
- Mecanismo: "Adjudicación a proveedor con contrato vigente, bajo las mismas condiciones" — renovación automática opaca sin licitación y SIN registro en el RUPC (Registro Único de Proveedores)

**Caso 4 — Fraccionamiento (pitufeo gubernamental):**
- Persona: DANIEL CHARIS CARRASCO
- Dependencia: INDAABIN (Instituto de Administración y Avalúos de Bienes Nacionales)
- Número de contratos en 2022: 42 contratos, TODOS adjudicaciones directas
- Mecanismo: En lugar de un contrato grande que obligaría a licitación, lo partieron en decenas de micro-contratos (ej. $2,433 pesos cada uno) al mismo individuo bajo distintos expedientes

**Dato estructural:**
- De 34,486 contratos totales en 2026, solo **8,295 fueron licitación pública** (24%)
- Más de **26,000 contratos** (76%) fueron adjudicaciones directas de algún tipo, sin proceso competitivo

---

## 🛠️ Stack Tecnológico

| Capa | Herramienta | Justificación |
|---|---|---|
| Frontend | Next.js 14 + Tailwind + shadcn/ui | Framework React con deploy fácil en Vercel |
| UI generada | v0 by Vercel | Cupón disponible, genera UI en segundos con prompt |
| Grafo visual | react-force-graph-2d | Gratis, se integra con React, aspecto profesional |
| Automatización datos | Make.com | Cupón disponible, pipeline sin código para cargar CSVs |
| Base de datos | Supabase (PostgreSQL) | Gratis, 500MB, API automática, fácil de conectar |
| Backend | FastAPI (Python) | Simple, rápido, ideal para endpoints de grafo |
| IA análisis | Magistral Medium via OpenRouter | Modelo gratuito ($0/$0 tokens) para análisis de redes |
| Alertas | Zavu API | WhatsApp/SMS cuando score > 80, cupón disponible |
| Hosting frontend | Vercel | Deploy con 1 comando, gratis |
| Hosting backend | Railway | Free tier, conecta con GitHub |
| Docs en editor | Context7 | Cupón disponible, documentación en tiempo real |

### Cupones disponibles (todos canjeados)
- ✅ v0 by Vercel — créditos para generar UI
- ✅ Make.com — 1 mes plan PRO
- ✅ Zavu — 3 meses Hobby + $10 USD créditos SMS/Voz
- ✅ Context7 — 1 mes PRO
- ✅ Faces — 1 mes PRO (presentaciones interactivas)
- ✅ Monologue — 3 meses PRO (dictado por voz)
- ✅ OpenRouter — cuenta creada, acceso a modelos incluyendo Magistral Medium (gratis)

### Schema de base de datos Supabase

```sql
-- Tabla principal
create table contratos (
  id serial primary key,
  rfc text,
  proveedor text,
  institucion text,
  monto numeric,
  tipo_procedimiento text,
  fecha_inicio text,
  fecha_fin text,
  num_contrato text,
  titulo text,
  orden_gobierno text,
  descripcion_ramo text
);

-- Proveedores con scoring
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

-- Conexiones para el grafo
create table conexiones (
  id serial primary key,
  rfc_proveedor text,
  nombre_proveedor text,
  institucion text,
  num_contratos int,
  monto_total numeric
);
```

### Endpoints del backend FastAPI

```
GET /search?q=nombre        → busca proveedores por nombre o RFC
GET /graph?rfc=XXX          → devuelve nodes[] y links[] para react-force-graph
GET /top-sospechosos        → top 20 proveedores por score descendente
GET /stats                  → totales del dataset (contratos, montos, adjudicaciones)
GET /alertas                → proveedores con flags activos y tipo de alerta
```

---

## 👥 Equipo

| Dev | Rol | Horario | Responsabilidad principal |
|---|---|---|---|
| **Dev A** | Datos / Python | Vie 10pm → Dom 7pm | Limpieza CSV, carga Supabase, scripts de scoring y detección |
| **Dev B** | Backend / FastAPI | Vie 10pm → Dom 7pm | API, endpoints, algoritmos, deploy Railway |
| **Dev C** | Frontend / Next.js | Vie 10pm → Dom 7pm | UI con v0, react-force-graph, páginas, deploy Vercel |
| **Dev D** | Integrations | Sáb 3pm → Dom 7pm | Zavu, OpenRouter IA, página /caso/:rfc, video demo, README |

**Nota importante:** Dev D no puede codear hasta el sábado a las 3pm porque su carro quedó encerrado en un estacionamiento que cerró con su laptop adentro.

**Ubicación:** Chihuahua, México. Hay LAN party presencial organizado por Escuelita Maker.

---

## 📋 Kanban en Notion

**Link:** https://www.notion.so/362a64cabbaf8115aad0c84bd937b129

**48 tareas organizadas en 5 fases:**

| Fase | Tareas | Horario real | Devs |
|---|---|---|---|
| F1 — Setup | 001–012 | Vie 10pm – 2am | A + B + C |
| F2 — Core Backend + Frontend | 013–024 | Sáb 10am – 2pm | A + B + C |
| F3 — Integración + Dev D | 025–037 | Sáb 3pm – 8pm | A + B + C + D |
| F4 — Deploy & Polish | 038–043 | Sáb 9pm – 12am | A + B + C + D |
| F5 — Demo & Entrega | 044–048 | Dom 10am – 5pm | A + B + C + D |

**Estados de las tarjetas:** ⬜ Por hacer / 🔄 En progreso / ✅ Terminado / 🔴 Bloqueado  
**Propiedades de cada tarea:** Fase, Dev asignado, Estado, Prioridad, Depende de, Descripción

---

## 🏗️ Arquitectura del Sistema

```
CompraNet CSVs (datos.gob.mx)
         ↓
      Make.com
   (limpia y carga automático)
         ↓
      Supabase (PostgreSQL)
  ┌──────┼──────┬──────────┐
contratos proveedores conexiones
         ↓
      FastAPI (Python)
  /search /graph /top /stats /alertas
         ↓
   Magistral Medium (OpenRouter)
   genera explicación en español
         ↓
      Next.js 14
  react-force-graph-2d
  Buscador + Grafo + Alertas
         ↓
      Zavu API
   WhatsApp cuando score > 80
         ↓
   Deploy: Vercel (frontend) + Railway (backend)
```

---

## 🎯 MVP Mínimo para Ganar (no negociable)

Esto DEBE estar el domingo 17 de mayo de 2026 a las 7pm:

1. ✅ **Buscador funcional** — buscar por nombre, RFC o dependencia
2. ✅ **Grafo visual con datos reales** — nodos coloreados por tipo, aristas = contratos
3. ✅ **Score automático 0–100** — calculado con el algoritmo de scoring
4. ✅ **Al menos 1 tipo de detección automática** — fantasmas, fraccionamiento o espejo
5. ✅ **Página /alertas** — lista de casos detectados
6. ✅ **Deploy público** — URL accesible para los jueces
7. ✅ **Repositorio open source** en GitHub con README

---

## 🎬 Estrategia para la Demo

Al presentar el domingo, el flujo ideal es:

1. Mostrar el problema: "El 76% de los contratos del gobierno mexicano se adjudican sin concurso"
2. Buscar en vivo "EDENRED" → grafo aparece con 215 nodos conectados → score alto → badge rojo
3. Ir a /alertas → mostrar las empresas fantasma 2026 detectadas automáticamente
4. Click en un caso (ej. Slycom) → página de detalle → botón "Analizar Red" → IA explica el patrón
5. Mostrar el caso de Daniel Charis → 42 contratos fraccionados al mismo individuo
6. Cerrar con: "Esto lo detectó RedContratos automáticamente en datos públicos que nadie había cruzado"

---

## 📝 Notas Importantes para el Asistente

### Reglas de Git
- **Al iniciar cada sesión**, verificar que las credenciales de git sean las correctas con `git config user.name` y `git config user.email`. Las credenciales correctas son `alexitogama` y `alejandrogarciamarquez1105@gmail.com`.
- **Antes de cualquier push a main**, hacer `git fetch origin && git log HEAD..origin/main --oneline` para verificar si hay commits nuevos. Si los hay, hacer pull primero para evitar conflictos.

- El equipo usa **React / Next.js** como stack principal y nivel **intermedio**
- El asistente (Claude) está activamente ayudando a codear durante el hackathon
- **No usar Magistral de OpenRouter a menos que se indique explícitamente** — por el momento se usa para el análisis de redes pero no es prioridad
- Los datos del CSV están en **encoding latin-1**, no UTF-8
- El CSV tiene **73 columnas**, las clave son: `rfc`, `Proveedor o contratista`, `Institución`, `Importe DRC`, `Tipo Procedimiento`, `Fecha de inicio del contrato`
- Ya se analizaron datos históricos de 2020-2022 con Gemini por otro miembro del equipo — esos datos confirman los casos de empresas fantasma
- La competencia directa (QuiénEsQuién.wiki) tiene su **API pública** documentada y puede usarse como fuente de datos adicional
- El proyecto es **completamente gratuito de operar** durante el hackathon usando los cupones y free tiers disponibles
- Todos los proyectos del hackathon **deben ser open source**
- La entrega es el **domingo 17 de mayo de 2026 a las 7pm**
