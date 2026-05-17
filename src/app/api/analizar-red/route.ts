const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "mistralai/magistral-medium";

function formatMontoTexto(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mil millones de pesos`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} millones de pesos`;
  return `${n.toLocaleString("es-MX")} pesos`;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENROUTER_API_KEY no configurada en el servidor" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { nombre, rfc, score, flags, totalContratos, totalMonto, numDependencias, pctAdj } = body;

  if (!nombre || !rfc) {
    return Response.json({ error: "Faltan datos del proveedor" }, { status: 400 });
  }

  const flagsDesc: string[] = [];
  if (flags?.fantasma)
    flagsDesc.push(
      "empresa fantasma (sin historial previo a 2026, recibe millones en adjudicaciones directas de emergencia)"
    );
  if (flags?.fraccionamiento)
    flagsDesc.push(
      "fraccionamiento de contratos (múltiples contratos pequeños al mismo beneficiario para evadir el umbral de licitación pública)"
    );
  if (flags?.espejo)
    flagsDesc.push(
      "contratos espejo (renovaciones automáticas opacas bajo la fórmula 'proveedor con contrato vigente' sin nuevo proceso competitivo)"
    );

  const flagsText =
    flagsDesc.length > 0
      ? `Patrones de fraude detectados: ${flagsDesc.join("; ")}.`
      : "No se detectaron patrones de fraude específicos, pero el score elevado indica concentración anómala.";

  const prompt = `Eres un analista de transparencia y anticorrupción especializado en contratos públicos de México.

Analiza el siguiente caso y escribe UN SOLO PÁRRAFO en español (máximo 140 palabras) explicando por qué esta red es sospechosa. Dirígete a ciudadanos y periodistas. Sé directo y usa datos concretos del caso. No uses listas ni bullets, solo prosa continua.

Datos del proveedor:
- Nombre: ${nombre}
- RFC: ${rfc}
- Score de riesgo: ${score}/100 (escala 0–100, donde 100 es máximo riesgo)
- Total de contratos: ${totalContratos}
- Monto total contratado: $${formatMontoTexto(totalMonto)}
- Dependencias gubernamentales distintas: ${numDependencias}
- Porcentaje de adjudicación directa (sin concurso público): ${pctAdj}%
- ${flagsText}

Párrafo de análisis:`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://redcontratos.vercel.app",
        "X-Title": "RedContratos",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.65,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json(
        { error: `Error de OpenRouter (${res.status}): ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const analisis =
      data.choices?.[0]?.message?.content?.trim() ??
      "No se pudo generar el análisis.";

    return Response.json({ analisis });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({ error: msg }, { status: 500 });
  }
}
