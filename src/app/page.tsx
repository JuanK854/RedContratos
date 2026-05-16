"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Network, Bell, BarChart3, Shield, ArrowRight, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { Buscador } from "@/components/buscador";
import { API_URL } from "@/lib/config";

interface Stats {
  total_contratos: number;
  monto_total: number;
  porcentaje_opacidad: number;
  total_proveedores: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ total_contratos: 34486, monto_total: 300000000000, porcentaje_opacidad: 76, total_proveedores: 0 });

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setStats({
          total_contratos: data.total_contratos ?? stats.total_contratos,
          monto_total: data.monto_total ?? stats.monto_total,
          porcentaje_opacidad: data.porcentaje_opacidad ?? stats.porcentaje_opacidad,
          total_proveedores: data.total_proveedores ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const formatNumber = (n: number) => n.toLocaleString("es-MX");

  const formatMonto = (n: number) => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <Network className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-red-500">Red</span>Contratos
            </span>
          </Link>

          {/* Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <Buscador />
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link href="/top" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Top Riesgo</span>
            </Link>
            <Link href="/explorador"
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-red-500/50 px-3 sm:px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <span className="hidden sm:inline">Explorar Grafo</span>
              <Network className="h-4 w-4 sm:hidden" />
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 text-center">
          <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-3 sm:px-4 py-1.5">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-xs sm:text-sm font-medium text-red-400">Plataforma de Inteligencia Anticorrupción</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            <span className="text-white">Transparencia en la</span>
            <br />
            <span className="text-red-500">Contratación Pública</span>
          </h1>

          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed px-2">
            Analiza redes de contratistas, detecta patrones de riesgo y explora
            conexiones ocultas en los contratos del gobierno federal mexicano.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row">
            <Link
              href="/explorador"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-500 transition-colors w-full sm:w-auto justify-center"
            >
              Explorar el Grafo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            icon={FileText}
            value={formatNumber(stats.total_contratos)}
            label="Total de Contratos"
            sublabel="Dataset CompraNet 2026"
          />
          <StatCard
            icon={DollarSign}
            value={formatMonto(stats.monto_total)}
            valueSuffix="MXN"
            label="Monto Total Analizado"
            sublabel="Gasto federal identificado"
          />
          <StatCard
            icon={AlertTriangle}
            value={`${stats.porcentaje_opacidad}%`}
            label="Adjudicaciones Directas"
            sublabel="Contratos otorgados sin licitación"
            highlight
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  valueSuffix,
  label,
  sublabel,
  highlight,
}: {
  icon: typeof FileText;
  value: string;
  valueSuffix?: string;
  label: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 transition-all hover:border-red-500/50 hover:bg-slate-900">
      <div className="mb-3 sm:mb-4 flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-lg bg-slate-800">
        <Icon className={`h-4 sm:h-5 w-4 sm:w-5 ${highlight ? "text-red-400" : "text-slate-400"}`} />
      </div>
      <p className={`text-3xl sm:text-5xl font-bold tracking-tight ${highlight ? "text-red-500" : "text-white"}`}>
        {value}
        {valueSuffix && <span className="ml-1 text-lg sm:text-2xl text-slate-500">{valueSuffix}</span>}
      </p>
      <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-slate-300">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}
