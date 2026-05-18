"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  Ghost,
  Scissors,
  Copy,
  AlertTriangle,
  DollarSign,
  ExternalLink,
  ShieldAlert,
  BellRing,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { ScoreBadge } from "@/components/score-badge";
import { Navbar } from "@/components/navbar";

interface Alerta {
  rfc: string;
  nombre: string;
  score: number;
  monto_involucrado: number;
  tipos_fraude: string[];
}

type TipoAlerta = "Empresa Fantasma" | "Fraccionamiento" | "Contrato Espejo";

const TIPOS: { key: TipoAlerta; label: string; icon: typeof Ghost; color: string; border: string; bg: string; description: string }[] = [
  {
    key: "Empresa Fantasma",
    label: "Empresas Fantasma",
    icon: Ghost,
    color: "text-green-400/70",
    border: "border-green-500/10",
    bg: "bg-green-500/5",
    description: "Proveedores sin historial previo que reciben millones en adjudicaciones directas",
  },
  {
    key: "Fraccionamiento",
    label: "Fraccionamiento",
    icon: Scissors,
    color: "text-orange-400/70",
    border: "border-orange-500/10",
    bg: "bg-orange-500/5",
    description: "Contratos fragmentados para evadir el umbral de licitación pública",
  },
  {
    key: "Contrato Espejo",
    label: "Contratos Espejo",
    icon: Copy,
    color: "text-purple-400/70",
    border: "border-purple-500/10",
    bg: "bg-purple-500/5",
    description: "Renovaciones automáticas opacas sin nuevo proceso competitivo",
  },
];

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabActivo, setTabActivo] = useState<TipoAlerta | "Todas">("Todas");
  const [analizando, setAnalizando] = useState(false);
  const [resultadoAnalisis, setResultadoAnalisis] = useState<{ enviadas: number; total: number; mensaje: string } | null>(null);
  const [telegramId, setTelegramId] = useState("");

  const ejecutarAnalisis = async () => {
    if (!telegramId.trim()) return;
    setAnalizando(true);
    setResultadoAnalisis(null);
    try {
      const res = await fetch("/api/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: telegramId.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResultadoAnalisis({ enviadas: data.alertas_enviadas, total: data.total_detectados, mensaje: data.mensaje });
    } catch {
      setResultadoAnalisis({ enviadas: 0, total: 0, mensaje: "Error al conectar con la API" });
    } finally {
      setAnalizando(false);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/alertas`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setAlertas(data.alertas || []))
      .catch((err) => setError(err.message || "Error al cargar alertas"))
      .finally(() => setLoading(false));
  }, []);

  const porTipo = (tipo: TipoAlerta) =>
    alertas.filter((a) => a.tipos_fraude.includes(tipo));

  const visibles =
    tabActivo === "Todas" ? alertas : alertas.filter((a) => a.tipos_fraude.includes(tabActivo));

  const formatMonto = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B MXN`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M MXN`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K MXN`;
    return `$${n} MXN`;
  };

  return (
    <Navbar>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* TÍTULO */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
              <ShieldAlert className="h-3.5 w-3.5 text-white/40" />
              <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Detección Automática</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Alertas de Corrupción
            </h1>
            <p className="mt-2 text-sm text-white/30">
              Casos detectados automáticamente en el dataset CompraNet 2026
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Tu ID de Telegram (ej. 8762288392)"
                className="h-9 rounded-lg bg-white/[0.03] border border-white/5 px-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-all duration-300 w-full sm:w-64"
              />
              <p className="text-[10px] text-white/20">
                Obtén tu ID con <span className="font-mono text-white/30">@getmyid_bot</span> · Inicia <span className="font-mono text-white/30">@RedContratos_Bot</span>
              </p>
            </div>
            <button
              onClick={ejecutarAnalisis}
              disabled={analizando || !telegramId.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              {analizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              {analizando ? "Analizando..." : "Ejecutar Análisis"}
            </button>

            {resultadoAnalisis && (
              <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                resultadoAnalisis.enviadas > 0 ? "border-green-500/10 bg-green-500/5" : "border-white/5 bg-white/[0.02]"
              }`}>
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${resultadoAnalisis.enviadas > 0 ? "text-green-400/70" : "text-white/25"}`} />
                <span className={`text-xs font-medium ${resultadoAnalisis.enviadas > 0 ? "text-green-400/70" : "text-white/30"}`}>
                  {resultadoAnalisis.mensaje}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* LOADING / ERROR */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border border-white/10 rounded-full animate-spin border-t-white/30" />
              <p className="text-sm text-white/30">Analizando patrones...</p>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-white/25 mb-3" />
            <p className="text-white/50 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* RESUMEN POR TIPO */}
            <div className="grid gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5 mb-8">
              <div className="grid sm:grid-cols-3">
                {TIPOS.map((t, idx) => {
                  const count = porTipo(t.key).length;
                  const Icon = t.icon;
                  const isLast = idx === TIPOS.length - 1;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTabActivo(tabActivo === t.key ? "Todas" : t.key)}
                      className={`text-left p-5 sm:p-6 transition-all duration-300 hover:bg-white/[0.02] ${!isLast ? 'sm:border-r sm:border-white/5' : ''} ${
                        tabActivo === t.key ? `bg-white/[0.03] ${t.border}` : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${t.bg} ${t.border}`}>
                          <Icon className={`h-4 w-4 ${t.color}`} />
                        </div>
                        <span className={`text-3xl font-light tracking-tighter ${t.color}`}>{count}</span>
                      </div>
                      <p className="mt-4 text-sm font-medium text-white/70">{t.label}</p>
                      <p className="mt-1 text-xs text-white/20 leading-snug">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TABS */}
            <div className="mb-5 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTabActivo("Todas")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-all duration-300 ${
                  tabActivo === "Todas" ? "bg-white text-[#0a0a0a]" : "bg-white/[0.03] border border-white/5 text-white/30 hover:text-white/60 hover:border-white/10"
                }`}
              >
                Todas ({alertas.length})
              </button>
              {TIPOS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTabActivo(tabActivo === t.key ? "Todas" : t.key)}
                  className={`rounded-md px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-all duration-300 ${
                    tabActivo === t.key ? `${t.bg} ${t.color} border ${t.border}` : "bg-white/[0.03] border border-white/5 text-white/30 hover:text-white/60 hover:border-white/10"
                  }`}
                >
                  {t.label} ({porTipo(t.key).length})
                </button>
              ))}
            </div>

            {/* LISTA DE CASOS */}
            {visibles.length === 0 ? (
              <div className="text-center py-24">
                <ShieldAlert className="mx-auto h-12 w-12 text-white/10 mb-4" />
                <p className="text-white/30">No hay alertas para este filtro</p>
              </div>
            ) : (
              <div className="flex flex-col gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
                {visibles.map((alerta, i) => (
                  <CasoCard key={alerta.rfc} alerta={alerta} index={i} formatMonto={formatMonto} isLast={i === visibles.length - 1} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Navbar>
  );
}

function CasoCard({
  alerta,
  index,
  formatMonto,
  isLast,
}: {
  alerta: Alerta;
  index: number;
  formatMonto: (n: number) => string;
  isLast: boolean;
}) {
  const flagConfig: Record<TipoAlerta, { icon: typeof Ghost; color: string; bg: string; border: string }> = {
    "Empresa Fantasma": { icon: Ghost, color: "text-green-400/70", bg: "bg-green-500/5", border: "border-green-500/10" },
    "Fraccionamiento": { icon: Scissors, color: "text-orange-400/70", bg: "bg-orange-500/5", border: "border-orange-500/10" },
    "Contrato Espejo": { icon: Copy, color: "text-purple-400/70", bg: "bg-purple-500/5", border: "border-purple-500/10" },
  };

  return (
    <div className={`bg-[#0a0a0a] p-4 sm:p-5 hover:bg-white/[0.02] transition-all duration-300 ${!isLast ? 'border-b border-white/[0.03]' : ''}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-xs font-medium text-white/20">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80 leading-tight truncate">{alerta.nombre}</p>
              <p className="text-xs text-white/15 font-mono mt-0.5">{alerta.rfc}</p>
            </div>
            <ScoreBadge score={alerta.score} size="sm" />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {alerta.tipos_fraude.map((tipo) => {
              const cfg = flagConfig[tipo as TipoAlerta];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <span key={tipo} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  <Icon className="h-3 w-3" />
                  {tipo}
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-white/15" />
              <span className="font-medium text-white/70 tabular-nums">{formatMonto(alerta.monto_involucrado)}</span>
              <span className="text-white/20 text-xs">involucrado</span>
            </div>
            <Link
              href={`/explorador?rfc=${encodeURIComponent(alerta.rfc)}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-300 shrink-0"
            >
              <Network className="h-3 w-3" />
              Ver Red
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
