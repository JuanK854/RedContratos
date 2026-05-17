"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Network,
  Ghost,
  Scissors,
  Copy,
  DollarSign,
  Building2,
  FileText,
  Calendar,
  ShieldAlert,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { ScoreBadge } from "@/components/score-badge";
import { API_URL } from "@/lib/config";

interface Contrato {
  num_contrato: string | null;
  institucion: string;
  tipo_procedimiento: string | null;
  monto: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface GraphLink {
  source: string;
  target: string;
  num_contratos: number;
  monto_total: number;
}

interface ProvInfo {
  name: string;
  score: number;
  flags: { fantasma: boolean; fraccionamiento: boolean; espejo: boolean };
  dependencias: { nombre: string; num_contratos: number; monto_total: number }[];
}

const FLAGS_CONFIG = [
  {
    key: "fantasma" as const,
    label: "Empresa Fantasma",
    icon: Ghost,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    desc: "Sin historial previo que de repente recibe millones en adjudicaciones directas",
  },
  {
    key: "fraccionamiento" as const,
    label: "Fraccionamiento",
    icon: Scissors,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    desc: "Contratos fragmentados para evadir el umbral de licitación pública",
  },
  {
    key: "espejo" as const,
    label: "Contrato Espejo",
    icon: Copy,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    desc: "Renovaciones automáticas opacas sin nuevo proceso competitivo",
  },
];

function extractYear(fecha: string | null): string | null {
  if (!fecha) return null;
  const isoMatch = fecha.match(/^(\d{4})-/);
  if (isoMatch) return isoMatch[1];
  const mxMatch = fecha.match(/(\d{4})$/);
  if (mxMatch) return mxMatch[1];
  return null;
}

function formatMonto(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B MXN`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M MXN`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K MXN`;
  return `$${n.toLocaleString("es-MX")} MXN`;
}

export default function CasoPage() {
  const params = useParams();
  const router = useRouter();
  const rfcRaw = params.rfc as string;
  const rfc = decodeURIComponent(rfcRaw);

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [provInfo, setProvInfo] = useState<ProvInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [analisis, setAnalisis] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);

  useEffect(() => {
    if (!rfc) return;

    Promise.all([
      fetch(`${API_URL}/graph?rfc=${encodeURIComponent(rfc)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API_URL}/contratos/${encodeURIComponent(rfc)}`)
        .then((r) => r.json())
        .catch(() => ({ contratos: [] })),
    ])
      .then(([graphData, contractsData]) => {
        if (graphData?.nodes) {
          const nodo = graphData.nodes.find(
            (n: any) => n.group === "proveedor"
          );
          const links: GraphLink[] = graphData.links || [];
          if (nodo) {
            setProvInfo({
              name: nodo.name,
              score: nodo.score ?? 0,
              flags: nodo.flags ?? {
                fantasma: false,
                fraccionamiento: false,
                espejo: false,
              },
              dependencias: links
                .map((l) => ({
                  nombre:
                    typeof l.target === "object"
                      ? (l.target as any).id
                      : l.target,
                  num_contratos: l.num_contratos,
                  monto_total: l.monto_total,
                }))
                .sort((a, b) => b.monto_total - a.monto_total),
            });
          }
        }
        setContratos(contractsData?.contratos || []);
      })
      .catch((err) => setFetchError(err.message || "Error al cargar datos"))
      .finally(() => setLoading(false));
  }, [rfc]);

  const stats = useMemo(() => {
    if (!contratos.length) return null;
    const totalMonto = contratos.reduce(
      (sum, c) => sum + (Number(c.monto) || 0),
      0
    );
    const adjDirectas = contratos.filter((c) =>
      c.tipo_procedimiento?.toLowerCase().includes("directa")
    ).length;
    const pctAdj =
      contratos.length > 0
        ? Math.round((adjDirectas / contratos.length) * 100)
        : 0;
    return { totalMonto, pctAdj };
  }, [contratos]);

  const montosPorAnio = useMemo(() => {
    const byYear: Record<string, number> = {};
    contratos.forEach((c) => {
      const year = extractYear(c.fecha_inicio);
      if (!year) return;
      byYear[year] = (byYear[year] || 0) + (Number(c.monto) || 0);
    });
    const entries = Object.entries(byYear).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([year, monto]) => ({
      year,
      monto,
      pct: Math.round((monto / max) * 100),
    }));
  }, [contratos]);

  const nombre = provInfo?.name ?? rfc;
  const flagsActivos = provInfo
    ? FLAGS_CONFIG.filter((f) => provInfo.flags[f.key])
    : [];

  async function analizarRed() {
    if (!provInfo) return;
    setAnalizando(true);
    setErrorAnalisis(null);
    setAnalisis(null);
    try {
      const res = await fetch("/api/analizar-red", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: provInfo.name,
          rfc,
          score: provInfo.score,
          flags: provInfo.flags,
          totalContratos: contratos.length,
          totalMonto: stats?.totalMonto ?? 0,
          numDependencias: provInfo.dependencias.length,
          pctAdj: stats?.pctAdj ?? 0,
        }),
      });
      const data = await res.json();
      if (data.error) setErrorAnalisis(data.error);
      else setAnalisis(data.analisis);
    } catch (e: unknown) {
      setErrorAnalisis(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setAnalizando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando análisis...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <Network className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-red-500">Red</span>Contratos
            </span>
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Cabecera del proveedor */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-3 py-1">
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">
                Análisis de Caso
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              {nombre}
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-400">{rfc}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            {provInfo && <ScoreBadge score={provInfo.score} size="lg" />}
            <button
              onClick={analizarRed}
              disabled={analizando || !provInfo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles
                className={`h-3.5 w-3.5 ${analizando ? "animate-pulse" : ""}`}
              />
              {analizando ? "Analizando..." : "Analizar Red"}
            </button>
            <Link
              href={`/explorador?rfc=${encodeURIComponent(rfc)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 transition-all"
            >
              <Network className="h-3.5 w-3.5" />
              Ver Red
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">{fetchError}</p>
          </div>
        )}

        {/* Flags activos */}
        {flagsActivos.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Patrones de Riesgo Detectados
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {flagsActivos.map((flag) => {
                const Icon = flag.icon;
                return (
                  <div
                    key={flag.key}
                    className={`rounded-xl border p-4 ${flag.border} ${flag.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${flag.color}`} />
                      <span className={`text-sm font-semibold ${flag.color}`}>
                        {flag.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      {flag.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Análisis IA */}
        {(analisis || errorAnalisis || analizando) && (
          <div
            className={`rounded-xl border p-5 ${
              errorAnalisis
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-red-500/20 bg-gradient-to-br from-red-950/30 to-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles
                className={`h-4 w-4 ${
                  errorAnalisis ? "text-yellow-400" : "text-red-400"
                } ${analizando ? "animate-pulse" : ""}`}
              />
              <h2 className="text-sm font-semibold text-white">
                Análisis de Red
              </h2>
              <span className="text-xs text-slate-500">— Magistral IA</span>
            </div>
            {analizando && !analisis && !errorAnalisis ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin shrink-0" />
                Generando análisis con inteligencia artificial...
              </div>
            ) : errorAnalisis ? (
              <p className="text-sm text-yellow-300">{errorAnalisis}</p>
            ) : (
              <p className="text-sm text-slate-200 leading-relaxed">{analisis}</p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={FileText}
            label="Total Contratos"
            value={contratos.length.toString()}
          />
          <StatCard
            icon={DollarSign}
            label="Monto Total"
            value={stats ? formatMonto(stats.totalMonto) : "—"}
          />
          <StatCard
            icon={Building2}
            label="Dependencias"
            value={
              provInfo ? provInfo.dependencias.length.toString() : "—"
            }
          />
          <StatCard
            icon={ShieldAlert}
            label="Adjudicación Directa"
            value={stats ? `${stats.pctAdj}%` : "—"}
            danger={stats ? stats.pctAdj >= 80 : false}
          />
        </div>

        {/* Monto por Año */}
        {montosPorAnio.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">
                Monto por Año
              </h2>
            </div>
            <div className="space-y-3">
              {montosPorAnio.map(({ year, monto, pct }) => (
                <div key={year} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-mono text-slate-400 shrink-0">
                    {year}
                  </span>
                  <div className="flex-1 h-6 rounded bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-red-500/70 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white shrink-0 w-24 text-right">
                    {formatMonto(monto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencias vinculadas */}
        {provInfo && provInfo.dependencias.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">
                Dependencias Vinculadas ({provInfo.dependencias.length})
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {provInfo.dependencias.slice(0, 10).map((dep, i) => (
                <div
                  key={dep.nombre}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="text-xs text-slate-600 w-5 shrink-0 text-right">
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 text-sm text-slate-200 truncate"
                    title={dep.nombre}
                  >
                    {dep.nombre}
                  </span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {dep.num_contratos}{" "}
                    {dep.num_contratos === 1 ? "contrato" : "contratos"}
                  </span>
                  <span className="text-xs font-semibold text-white shrink-0 w-24 text-right">
                    {formatMonto(dep.monto_total)}
                  </span>
                </div>
              ))}
            </div>
            {provInfo.dependencias.length > 10 && (
              <p className="mt-3 text-xs text-slate-500 text-center">
                +{provInfo.dependencias.length - 10} dependencias más
              </p>
            )}
          </div>
        )}

        {/* Timeline de Contratos */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-white/10">
            <Calendar className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">
              Timeline de Contratos ({contratos.length})
            </h2>
            <Link
              href={`/contratos/${encodeURIComponent(rfc)}`}
              className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {contratos.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No se encontraron contratos para este RFC
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-slate-500 text-xs uppercase tracking-wider bg-slate-900/80">
                    <tr>
                      <th className="px-5 py-3 font-medium">Fecha Inicio</th>
                      <th className="px-5 py-3 font-medium">Fecha Fin</th>
                      <th className="px-5 py-3 font-medium">Institución</th>
                      <th className="px-5 py-3 font-medium">Tipo</th>
                      <th className="px-5 py-3 font-medium text-right">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {contratos.slice(0, 25).map((c, i) => {
                      const esDirecta = c.tipo_procedimiento
                        ?.toLowerCase()
                        .includes("directa");
                      return (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-xs text-slate-400">
                            {c.fecha_inicio || "—"}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-400">
                            {c.fecha_fin || "—"}
                          </td>
                          <td className="px-5 py-3 text-slate-200">
                            <span
                              className="block max-w-xs truncate"
                              title={c.institucion}
                            >
                              {c.institucion}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                esDirecta
                                  ? "text-red-400 bg-red-500/10 border-red-500/30"
                                  : "text-slate-400 bg-slate-800 border-white/10"
                              }`}
                            >
                              {c.tipo_procedimiento || "N/A"}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-white text-right">
                            {c.monto ? formatMonto(Number(c.monto)) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {contratos.length > 25 && (
                <div className="px-5 py-3 border-t border-white/5 text-center">
                  <Link
                    href={`/contratos/${encodeURIComponent(rfc)}`}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Ver los {contratos.length - 25} contratos restantes →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={`h-4 w-4 ${danger ? "text-red-400" : "text-slate-500"}`}
        />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${danger ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
