import os
import requests as http_requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
ZAVU_API_KEY = os.environ.get("ZAVU_API_KEY", "")
ZAVU_TELEGRAM_TO = os.environ.get("ZAVU_TELEGRAM_TO", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")

# Inicialización del cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ZAVU_URL = "https://api.zavu.dev/v1/messages"
SCORE_ALERTA = 70

app = FastAPI(
    title="RedContratos API",
    description="Backend para la detección automatizada de redes de corrupción en contratos públicos",
    version="1.0.0"
)

# Configuración de CORS
# Se incluye "*" para evitar bloqueos durante el desarrollo remoto y las pruebas locales con Next.js
origins = [
    "http://localhost:3000",
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "ok", 
        "message": "API de RedContratos en funcionamiento. CORS habilitado de forma segura 🕸️"
    }

# --- ENDPOINTS DEL MVP ---

@app.get("/stats")
def get_stats():
    """Retorna las estadísticas globales del dataset para los contadores del dashboard."""
    try:
        # 1. Total histórico de contratos en la base
        total_resp = supabase.table("contratos").select("*", count="exact").limit(1).execute()
        total_contratos = total_resp.count

        # 2. Contar cuántos fueron dados a dedo (Adjudicación Directa)
        # Usamos ilike por si hay variaciones en mayúsculas o acentos en el CSV
        adj_resp = (
            supabase.table("contratos")
            .select("*", count="exact")
            .ilike("tipo_procedimiento", "%Adjudicaci%n Directa%")
            .limit(1)
            .execute()
        )
        total_adjudicaciones = adj_resp.count

        # 3. Contar las Licitaciones Públicas (los que sí concursaron)
        lic_resp = (
            supabase.table("contratos")
            .select("*", count="exact")
            .ilike("tipo_procedimiento", "%Licitaci%n P%blica%")
            .limit(1)
            .execute()
        )
        total_licitaciones = lic_resp.count

        # Calculamos el porcentaje para dárselo peladito y en la boca al frontend
        pct_adjudicaciones = 0
        if total_contratos and total_contratos > 0:
            pct_adjudicaciones = round((total_adjudicaciones / total_contratos) * 100, 1)

        return {
            "total_contratos": total_contratos,
            "total_adjudicaciones": total_adjudicaciones,
            "total_licitaciones": total_licitaciones,
            "porcentaje_opacidad": pct_adjudicaciones,  # El 76% que van a usar de gancho en la demo
            "mensaje": "El porcentaje de opacidad representa los contratos sin concurso competitivo."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular las estadísticas: {str(e)}")

@app.get("/search")
def search_proveedores(q: str = ""):
    """Busca proveedores por coincidencia de texto o RFC."""
    # Validación rápida: evitar búsquedas masivas si el string es muy corto
    if not q or len(q) < 3:
        return {"query": q, "results": []}
    
    try:
        # Usamos .or_ para buscar coincidencias parciales tanto en nombre como en RFC
        # Seleccionamos solo los datos clave para que el frontend arme la lista rápida
        response = (
            supabase.table("proveedores")
            .select("rfc, nombre, score, total_contratos, flag_fantasma, flag_fraccionamiento, flag_espejo")
            .or_(f"nombre.ilike.%{q}%,rfc.ilike.%{q}%")
            .order("score", desc=True)  # Ordenamos para que los más sospechosos salgan arriba
            .limit(15)
            .execute()
        )
        
        return {
            "query": q, 
            "results": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la búsqueda: {str(e)}")

@app.get("/graph")
def get_graph(rfc: str):
    """Devuelve la estructura de nodos y enlaces requerida por react-force-graph."""
    if not rfc:
        raise HTTPException(status_code=400, detail="Se requiere el RFC del proveedor")
        
    try:
        # 1. Obtener los datos del nodo central (El Proveedor)
        prov_response = supabase.table("proveedores").select("*").eq("rfc", rfc).execute()
        
        if not prov_response.data:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")
            
        proveedor = prov_response.data[0]

        # 2. Obtener todas las conexiones de este proveedor hacia las instituciones
        conex_response = supabase.table("conexiones").select("*").eq("rfc_proveedor", rfc).execute()
        conexiones = conex_response.data

        # 3. Construir la estructura requerida por el frontend
        nodes = []
        links = []
        instituciones_vistas = set()

        # Nodo central (Proveedor) - Le pasamos los flags para pintarlo de rojo en la UI si es necesario
        nodes.append({
            "id": proveedor["rfc"],
            "name": proveedor["nombre"],
            "group": "proveedor",
            "score": proveedor["score"],
            "val": 20, # Tamaño base para que resalte visualmente
            "flags": {
                "fantasma": proveedor.get("flag_fantasma", False),
                "fraccionamiento": proveedor.get("flag_fraccionamiento", False),
                "espejo": proveedor.get("flag_espejo", False)
            }
        })

        # Nodos destino (Instituciones) y los Enlaces (Links)
        for conn in conexiones:
            inst_name = conn["institucion"]
            
            # Evitar crear el nodo de la institución dos veces si hay duplicados
            if inst_name not in instituciones_vistas:
                nodes.append({
                    "id": inst_name,
                    "name": inst_name,
                    "group": "institucion",
                    "val": 10 # Tamaño más pequeño para las dependencias
                })
                instituciones_vistas.add(inst_name)
            
            # Crear la línea que une al proveedor con la institución
            links.append({
                "source": proveedor["rfc"],
                "target": inst_name,
                "num_contratos": conn["num_contratos"],
                "monto_total": float(conn["monto_total"]) if conn["monto_total"] else 0
            })

        return {
            "nodes": nodes, 
            "links": links
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el grafo: {str(e)}")

@app.get("/top-sospechosos")
def get_top_sospechosos():
    """Retorna los top 20 proveedores con los puntajes de riesgo más altos."""
    try:
        # Traemos a los peores del listado ordenados por su score
        response = (
            supabase.table("proveedores")
            .select("rfc, nombre, score, num_dependencias, total_contratos, total_monto")
            .order("score", desc=True)
            .limit(20)
            .execute()
        )
        
        return {"top_sospechosos": response.data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el top de sospechosos: {str(e)}")

@app.get("/alertas")
def get_alertas():
    """Dashboard de alertas activas agrupadas por los patrones de fraude detectados."""
    try:
        # Buscamos proveedores que tengan al menos un flag activo usando .or_
        response = (
            supabase.table("proveedores")
            .select("rfc, nombre, total_monto, score, flag_fantasma, flag_fraccionamiento, flag_espejo")
            .or_("flag_fantasma.eq.true,flag_fraccionamiento.eq.true,flag_espejo.eq.true")
            .order("score", desc=True)
            .limit(50)  # Limitamos al top 50 para no saturar la vista inicial
            .execute()
        )

        alertas_procesadas = []
        
        # Formateamos la respuesta para hacerle la vida fácil al frontend
        for prov in response.data:
            tipos_fraude = []
            
            # Traducimos los booleanos a etiquetas legibles para la UI
            if prov.get("flag_fantasma"): 
                tipos_fraude.append("Empresa Fantasma")
            if prov.get("flag_fraccionamiento"): 
                tipos_fraude.append("Fraccionamiento")
            if prov.get("flag_espejo"): 
                tipos_fraude.append("Contrato Espejo")

            alertas_procesadas.append({
                "rfc": prov["rfc"],
                "nombre": prov["nombre"],
                "score": prov["score"],
                "monto_involucrado": float(prov["total_monto"]) if prov["total_monto"] else 0,
                "tipos_fraude": tipos_fraude
            })

        return {"alertas": alertas_procesadas}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar las alertas: {str(e)}")


# --- HELPER ZAVU ---

def _enviar_telegram(nombre: str, rfc: str, score: int, tipos_fraude: list[str], monto: float) -> dict:
    """Envía una alerta por Telegram vía Zavu para un proveedor con score alto."""
    if not ZAVU_API_KEY or not ZAVU_TELEGRAM_TO:
        return {"ok": False, "error": "ZAVU_API_KEY o ZAVU_TELEGRAM_TO no configurados"}

    tipos_str = ", ".join(tipos_fraude) if tipos_fraude else "Sin clasificar"
    monto_str = (
        f"${monto / 1e9:.1f}B" if monto >= 1e9
        else f"${monto / 1e6:.0f}M" if monto >= 1e6
        else f"${monto:,.0f}"
    )

    mensaje = (
        f"🚨 Alerta RedContratos\n\n"
        f"📋 Proveedor: {nombre}\n"
        f"🔑 RFC: {rfc}\n"
        f"⚠️ Score de riesgo: {score}/100\n"
        f"🚩 Tipo de alerta: {tipos_str}\n"
        f"💰 Monto involucrado: {monto_str} MXN"
    )

    try:
        resp = http_requests.post(
            ZAVU_URL,
            json={"to": ZAVU_TELEGRAM_TO, "channel": "telegram", "text": mensaje},
            headers={"Authorization": f"Bearer {ZAVU_API_KEY}", "Content-Type": "application/json"},
            timeout=10,
        )
        return {"ok": resp.status_code < 300, "status": resp.status_code, "body": resp.text}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.post("/analizar")
def analizar_y_alertar():
    """
    Consulta todos los proveedores con score > 80 y envía una alerta WhatsApp
    por cada uno vía Zavu. Devuelve un resumen de los mensajes enviados.
    """
    try:
        resp = (
            supabase.table("proveedores")
            .select("rfc, nombre, score, total_monto, flag_fantasma, flag_fraccionamiento, flag_espejo")
            .gte("score", SCORE_ALERTA)
            .order("score", desc=True)
            .execute()
        )

        if not resp.data:
            return {"mensaje": f"No hay proveedores con score >= {SCORE_ALERTA}", "alertas_enviadas": 0, "resultados": []}

        resultados = []
        for prov in resp.data:
            tipos_fraude = []
            if prov.get("flag_fantasma"):
                tipos_fraude.append("Empresa Fantasma")
            if prov.get("flag_fraccionamiento"):
                tipos_fraude.append("Fraccionamiento")
            if prov.get("flag_espejo"):
                tipos_fraude.append("Contrato Espejo")

            zavu_result = _enviar_telegram(
                nombre=prov["nombre"],
                rfc=prov["rfc"],
                score=prov["score"],
                tipos_fraude=tipos_fraude,
                monto=float(prov["total_monto"]) if prov["total_monto"] else 0,
            )

            resultados.append({
                "rfc": prov["rfc"],
                "nombre": prov["nombre"],
                "score": prov["score"],
                "telegram_enviado": zavu_result["ok"],
                "detalle": zavu_result,
            })

        enviados = sum(1 for r in resultados if r["telegram_enviado"])

        return {
            "mensaje": f"{enviados} alertas Telegram enviadas de {len(resultados)} proveedores con score >= {SCORE_ALERTA}",
            "alertas_enviadas": enviados,
            "total_detectados": len(resultados),
            "resultados": resultados,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al ejecutar análisis: {str(e)}")