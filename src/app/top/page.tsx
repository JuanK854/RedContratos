"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Network, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/config";
import { ScoreBadge } from "@/components/score-badge";
import { Navbar } from "@/components/navbar";

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
    <Navbar>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-white/40" />
            <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Ranking de Riesgo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Top 20 Proveedores Más Sospechosos
          </h1>
          <p className="mt-2 text-sm text-white/30 max-w-xl">
            Proveedores con mayor score de riesgo basado en patrones de contratación
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border border-white/10 rounded-full animate-spin border-t-white/40" />
              <p className="text-sm text-white/30">Cargando ranking...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-white/25 mb-3" />
            <p className="text-white/50 font-medium">{error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && proveedores.length > 0 && (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-xl overflow-hidden border border-white/5">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01]">
                <div className="col-span-1 text-[10px] font-medium text-white/25 uppercase tracking-widest">#</div>
                <div className="col-span-4 text-[10px] font-medium text-white/25 uppercase tracking-widest">Proveedor</div>
                <div className="col-span-2 text-[10px] font-medium text-white/25 uppercase tracking-widest text-center">Score</div>
                <div className="col-span-2 text-[10px] font-medium text-white/25 uppercase tracking-widest text-right">Monto Total</div>
                <div className="col-span-1 text-[10px] font-medium text-white/25 uppercase tracking-widest text-center">Dep.</div>
                <div className="col-span-2 text-[10px] font-medium text-white/25 uppercase tracking-widest text-center">Acción</div>
              </div>
              {proveedores.map((p, i) => (
                <div
                  key={p.rfc}
                  className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-all duration-300 last:border-0"
                >
                  <div className="col-span-1"><RankBadge rank={i + 1} /></div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{p.nombre}</p>
                    <p className="text-xs text-white/20 font-mono mt-0.5">{p.rfc}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      {p.flag_fantasma && <FlagBadge label="Fantasma" color="text-green-400/70 bg-green-500/5 border-green-500/10" />}
                      {p.flag_fraccionamiento && <FlagBadge label="Fraccionamiento" color="text-orange-400/70 bg-orange-500/5 border-orange-500/10" />}
                      {p.flag_espejo && <FlagBadge label="Espejo" color="text-purple-400/70 bg-purple-500/5 border-purple-500/10" />}
                    </div>
                  </div>
                  <div className="col-span-2 text-center"><ScoreBadge score={p.score} size="sm" /></div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-medium text-white/80 tabular-nums">{formatMonto(p.total_monto)}</p>
                    <p className="text-xs text-white/20">{p.total_contratos} contratos</p>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium text-white/40 tabular-nums">{p.num_dependencias}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <Link
                      href={`/explorador?rfc=${encodeURIComponent(p.rfc)}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/80 hover:border-white/20 transition-all duration-300"
                    >
                      <Network className="h-3 w-3" />
                      Ver Red
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile */}
            <div className="md:hidden flex flex-col gap-2">
              {proveedores.map((p, i) => (
                <Link
                  key={p.rfc}
                  href={`/explorador?rfc=${encodeURIComponent(p.rfc)}`}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300 block"
                >
                  <div className="flex items-start gap-3">
                    <RankBadge rank={i + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/90 truncate">{p.nombre}</p>
                      <p className="text-xs text-white/20 font-mono">{p.rfc}</p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {p.flag_fantasma && <FlagBadge label="Fantasma" color="text-green-400/70 bg-green-500/5 border-green-500/10" />}
                        {p.flag_fraccionamiento && <FlagBadge label="Fraccionamiento" color="text-orange-400/70 bg-orange-500/5 border-orange-500/10" />}
                        {p.flag_espejo && <FlagBadge label="Espejo" color="text-purple-400/70 bg-purple-500/5 border-purple-500/10" />}
                      </div>
                    </div>
                    <ScoreBadge score={p.score} size="sm" />
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white/80 tabular-nums">{formatMonto(p.total_monto)}</p>
                      <p className="text-xs text-white/20">{p.total_contratos} contratos · {p.num_dependencias} dep.</p>
                    </div>
                    <span className="text-xs font-medium text-white/40 flex items-center gap-1">
                      Ver Red <Network className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Navbar>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const isTop = rank <= 3;
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-medium shrink-0 ${
      isTop ? "bg-white/[0.06] text-white/70 border border-white/10" : "text-white/20"
    }`}>
      {rank}
    </span>
  );
}

function FlagBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${color}`}>
      {label}
    </span>
  );
}
