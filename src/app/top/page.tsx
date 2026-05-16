"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Network, ArrowLeft, AlertTriangle, Shield } from "lucide-react";
import { API_URL } from "@/lib/config";
import { ScoreBadge } from "@/components/score-badge";

interface ProveedorTop {
  rfc: string;
  nombre: string;
  score: number;
  total_monto: number;
  num_dependencias: number;
  total_contratos: number;
  flag_fantasma: boolean;
  flag_fraccionamiento: boolean;
  flag_espejo: boolean;
}

export default function TopPage() {
  const [proveedores, setProveedores] = useState<ProveedorTop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/top-sospechosos`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProveedores(data.top_sospechosos || []);
      })
      .catch((err) => {
        setError(err.message || "Error al cargar datos");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatMonto = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n}`;
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

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Title */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-3 sm:px-4 py-1.5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs sm:text-sm font-medium text-red-400">Ranking de Riesgo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Top 20 Proveedores Más Sospechosos
          </h1>
          <p className="mt-1 sm:mt-2 text-sm text-slate-400">
            Proveedores con mayor score de riesgo basado en patrones de contratación
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Cargando ranking...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-3" />
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-sm text-slate-500 mt-1">Verifica la conexión con la API</p>
          </div>
        )}

        {/* Mobile: Card list */}
        {!loading && !error && proveedores.length > 0 && (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 bg-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Proveedor</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-right">Monto Total</div>
                <div className="col-span-1 text-center">Dep.</div>
                <div className="col-span-2 text-center">Acción</div>
              </div>
              {proveedores.map((p, i) => (
                <div
                  key={p.rfc}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors"
                >
                  <div className="col-span-1"><RankBadge rank={i + 1} /></div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{p.rfc}</p>
                    <div className="flex gap-1 mt-1">
                      {p.flag_fantasma && <FlagBadge label="Fantasma" color="bg-green-500/20 text-green-400" />}
                      {p.flag_fraccionamiento && <FlagBadge label="Fraccionamiento" color="bg-orange-500/20 text-orange-400" />}
                      {p.flag_espejo && <FlagBadge label="Espejo" color="bg-purple-500/20 text-purple-400" />}
                    </div>
                  </div>
                  <div className="col-span-2 text-center"><ScoreBadge score={p.score} size="sm" /></div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-semibold text-white">{formatMonto(p.total_monto)}</p>
                    <p className="text-xs text-slate-500">{p.total_contratos} contratos</p>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium text-slate-300">{p.num_dependencias}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <Link
                      href={`/explorador?rfc=${encodeURIComponent(p.rfc)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                      <Network className="h-3 w-3" />
                      Ver Red
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {proveedores.map((p, i) => (
                <Link
                  key={p.rfc}
                  href={`/explorador?rfc=${encodeURIComponent(p.rfc)}`}
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-4 hover:bg-slate-900 transition-colors block"
                >
                  <div className="flex items-start gap-3">
                    <RankBadge rank={i + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.nombre}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.rfc}</p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {p.flag_fantasma && <FlagBadge label="Fantasma" color="bg-green-500/20 text-green-400" />}
                        {p.flag_fraccionamiento && <FlagBadge label="Fraccionamiento" color="bg-orange-500/20 text-orange-400" />}
                        {p.flag_espejo && <FlagBadge label="Espejo" color="bg-purple-500/20 text-purple-400" />}
                      </div>
                    </div>
                    <ScoreBadge score={p.score} size="sm" />
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      <p className="text-sm font-semibold text-white">{formatMonto(p.total_monto)}</p>
                      <p className="text-xs text-slate-500">{p.total_contratos} contratos · {p.num_dependencias} dep.</p>
                    </div>
                    <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                      Ver Red <Network className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && proveedores.length === 0 && (
          <div className="text-center py-20">
            <Shield className="mx-auto h-12 w-12 text-slate-700 mb-4" />
            <p className="text-slate-400">No hay datos disponibles</p>
          </div>
        )}
      </main>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : rank === 2
      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
      : rank === 3
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-slate-800 text-slate-400 border-slate-700";

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold shrink-0 ${colors}`}>
      {rank}
    </span>
  );
}

function FlagBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      {label}
    </span>
  );
}
