import Zavu from "@zavudev/sdk";

const SCORE_ALERTA = 70;
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://redcontratos-production.up.railway.app";

interface Alerta {
  rfc: string;
  nombre: string;
  score: number;
  monto_involucrado: number;
  tipos_fraude: string[];
}

function formatMonto(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ZAVU_API_KEY;
  const senderId = process.env.ZAVU_SENDER_ID;

  if (!apiKey || !senderId) {
    return Response.json(
      { error: "ZAVU_API_KEY o ZAVU_SENDER_ID no configurados" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const telegramTo = body.telegram_id || process.env.ZAVU_TELEGRAM_TO;

  if (!telegramTo) {
    return Response.json(
      { error: "Se requiere un ID de Telegram" },
      { status: 400 }
    );
  }

  const zavu = new Zavu({ apiKey, defaultHeaders: { "Zavu-Sender": senderId } });

  const alertasRes = await fetch(`${API_URL}/alertas`);
  if (!alertasRes.ok) {
    return Response.json(
      { error: `Error al obtener alertas: HTTP ${alertasRes.status}` },
      { status: 502 }
    );
  }

  const { alertas = [] }: { alertas: Alerta[] } = await alertasRes.json();
  const conAlerta = alertas.filter((a) => a.score >= SCORE_ALERTA);

  if (conAlerta.length === 0) {
    return Response.json({
      mensaje: `No hay proveedores con score >= ${SCORE_ALERTA}`,
      alertas_enviadas: 0,
      total_detectados: 0,
      resultados: [],
    });
  }

  let enviadas = 0;
  const resultados: { rfc: string; nombre: string; enviado: boolean }[] = [];

  for (const alerta of conAlerta) {
    const tiposStr = alerta.tipos_fraude.join(", ") || "Sin clasificar";
    const texto =
      `🚨 Alerta RedContratos\n\n` +
      `📋 Proveedor: ${alerta.nombre}\n` +
      `🔑 RFC: ${alerta.rfc}\n` +
      `⚠️ Score de riesgo: ${alerta.score}/100\n` +
      `🚩 Tipo: ${tiposStr}\n` +
      `💰 Monto: ${formatMonto(alerta.monto_involucrado)} MXN`;

    try {
      await zavu.messages.send({
        to: telegramTo,
        channel: "telegram",
        text: texto,
      });
      enviadas++;
      resultados.push({ rfc: alerta.rfc, nombre: alerta.nombre, enviado: true });
    } catch {
      resultados.push({ rfc: alerta.rfc, nombre: alerta.nombre, enviado: false });
    }
  }

  return Response.json({
    mensaje: `${enviadas} alertas Telegram enviadas de ${conAlerta.length} proveedores con score >= ${SCORE_ALERTA}`,
    alertas_enviadas: enviadas,
    total_detectados: conAlerta.length,
    resultados,
  });
}
