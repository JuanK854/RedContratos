"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  ArrowLeft,
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
    color: "text-green-400",
    border: "border-green-500/30",
    bg: "bg-green-500/10",
    description: "Proveedores sin historial previo que reciben millones en adjudicaciones directas",
  },
  {
    key: "Fraccionamiento",
    label: "Fraccionamiento",
    icon: Scissors,
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    description: "Contratos fragmentados para evadir el umbral de licitación pública",
  },
  {
    key: "Contrato Espejo",
    label: "Contratos Espejo",
    icon: Copy,
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
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

  const ejecutarAnalisis = async () => {
    setAnalizando(true);
    setResultadoAnalisis(null);
    try {
      const res = await fetch(`${API_URL}/analizar`, { method: "POST" });
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <Network className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-red-500">Red</span>Contratos
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        {/* TÍTULO */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-3 py-1.5">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span className="text-xs font-medium text-red-400">Detección Automática</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Alertas de Corrupción
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Casos detectados automáticamente en el dataset CompraNet 2026
            </p>
          </div>

          {/* Botón analizar + feedback */}
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <button
              onClick={ejecutarAnalisis}
              disabled={analizando}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {analizando
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <BellRing className="h-4 w-4" />}
              {analizando ? "Analizando..." : "Ejecutar Análisis"}
            </button>

            {resultadoAnalisis && (
              <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                resultadoAnalisis.enviadas > 0
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-slate-500/30 bg-slate-800/50"
              }`}>
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${resultadoAnalisis.enviadas > 0 ? "text-green-400" : "text-slate-400"}`} />
                <span className={`text-xs font-medium ${resultadoAnalisis.enviadas > 0 ? "text-green-400" : "text-slate-400"}`}>
                  {resultadoAnalisis.mensaje}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* LOADING / ERROR */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Analizando patrones...</p>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-3" />
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-sm text-slate-500 mt-1">Verifica la conexión con la API</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* RESUMEN POR TIPO */}
            <div className="grid gap-3 sm:grid-cols-3 mb-8">
              {TIPOS.map((t) => {
                const count = porTipo(t.key).length;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTabActivo(tabActivo === t.key ? "Todas" : t.key)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      tabActivo === t.key
                        ? `${t.border} ${t.bg}`
                        : "border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.bg} ${t.border} border`}>
                        <Icon className={`h-4 w-4 ${t.color}`} />
                      </div>
                      <span className={`text-2xl font-bold ${t.color}`}>{count}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{t.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500 leading-snug">{t.description}</p>
                  </button>
                );
              })}
            </div>

            {/* TABS */}
            <div className="mb-5 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTabActivo("Todas")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  tabActivo === "Todas"
                    ? "bg-red-600 text-white"
                    : "bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                Todas ({alertas.length})
              </button>
              {TIPOS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTabActivo(tabActivo === t.key ? "Todas" : t.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    tabActivo === t.key
                      ? `${t.bg} ${t.color} border ${t.border}`
                      : "bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label} ({porTipo(t.key).length})
                </button>
              ))}
            </div>

            {/* LISTA DE CASOS */}
            {visibles.length === 0 ? (
              <div className="text-center py-20">
                <ShieldAlert className="mx-auto h-12 w-12 text-slate-700 mb-4" />
                <p className="text-slate-400">No hay alertas para este filtro</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibles.map((alerta, i) => (
                  <CasoCard key={alerta.rfc} alerta={alerta} index={i} formatMonto={formatMonto} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CasoCard({
  alerta,
  index,
  formatMonto,
}: {
  alerta: Alerta;
  index: number;
  formatMonto: (n: number) => string;
}) {
  const flagConfig: Record<TipoAlerta, { icon: typeof Ghost; color: string; bg: string; border: string }> = {
    "Empresa Fantasma": { icon: Ghost, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
    "Fraccionamiento": { icon: Scissors, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    "Contrato Espejo": { icon: Copy, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5 hover:bg-slate-900 transition-colors">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Número */}
        <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-slate-800 text-xs font-bold text-slate-400">
          {index + 1}
        </span>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">{alerta.nombre}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{alerta.rfc}</p>
            </div>
            <ScoreBadge score={alerta.score} size="sm" />
          </div>

          {/* Flags */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {alerta.tipos_fraude.map((tipo) => {
              const cfg = flagConfig[tipo as TipoAlerta];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <span
                  key={tipo}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}
                >
                  <Icon className="h-3 w-3" />
                  {tipo}
                </span>
              );
            })}
          </div>

          {/* Monto + acción */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-white">{formatMonto(alerta.monto_involucrado)}</span>
              <span className="text-slate-500 text-xs">involucrado</span>
            </div>
            <Link
              href={`/explorador?rfc=${encodeURIComponent(alerta.rfc)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all shrink-0"
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
