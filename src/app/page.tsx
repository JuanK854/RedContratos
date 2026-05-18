"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { FileText, DollarSign, AlertTriangle, ArrowRight, Shield, Network } from "lucide-react";
import { API_URL } from "@/lib/config";

interface Stats {
  total_contratos: number;
  monto_total: number;
  porcentaje_opacidad: number;
  total_proveedores: number;
}

function useCountUp(end: number, duration: number = 2000, startOnMount: boolean = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!startOnMount) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, startOnMount]);

  return count;
}

function AnimatedNumber({ value, suffix = "", prefix = "", decimals = 0 }: { value: number; suffix?: string; prefix?: string; decimals?: number }) {
  const count = useCountUp(value, 2200);
  const formatted = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString("es-MX");
  return <span>{prefix}{formatted}{suffix}</span>;
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

  const formatMonto = (n: number) => {
    if (n >= 1e12) return (n / 1e12).toFixed(1);
    if (n >= 1e9) return (n / 1e9).toFixed(0);
    if (n >= 1e6) return (n / 1e6).toFixed(0);
    return n.toString();
  };

  const montoBillions = stats.monto_total >= 1e9 ? stats.monto_total / 1e9 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/10 group-hover:border-red-500/30 transition-all duration-300">
              <Network className="h-4 w-4 text-white/80 group-hover:text-red-400 transition-colors duration-300" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Red</span>
              <span className="text-white/50">Contratos</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6">
            <Link href="/top" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-all duration-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Top Riesgo</span>
            </Link>
            <Link href="/explorador"
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-white/10 px-3 sm:px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-all duration-300"
            >
              <span className="hidden sm:inline">Explorar Grafo</span>
              <Network className="h-4 w-4 sm:hidden" />
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(127, 29, 29, 0.12) 0%, rgba(10, 10, 10, 0) 70%)",
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 grid-bg opacity-30" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 animate-fade-in">
            <Shield className="h-3.5 w-3.5 text-white/40" />
            <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Plataforma de Inteligencia Anticorrupción</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight animate-slide-up">
            <span className="text-white">Transparencia en la</span>
            <br />
            <span className="text-white">Contratación Pública</span>
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 ml-2 align-middle" />
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg text-white/40 leading-relaxed px-2 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            Analiza redes de contratistas, detecta patrones de riesgo y explora
            conexiones ocultas en los contratos del gobierno federal mexicano.
          </p>

          {/* CTA */}
          <div className="mt-10 sm:mt-12 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/explorador"
              className="group inline-flex items-center gap-2 rounded-lg bg-red-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-red-500 transition-all duration-300 shadow-lg shadow-red-950/30 hover:shadow-red-950/50"
            >
              Explorar el Grafo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="grid gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
          <div className="grid sm:grid-cols-3">
            <StatCard
              icon={FileText}
              value={<AnimatedNumber value={stats.total_contratos} />}
              label="Total de Contratos"
              sublabel="Dataset CompraNet 2026"
              borderRight
            />
            <StatCard
              icon={DollarSign}
              value={<><span className="text-white/40">$</span><AnimatedNumber value={montoBillions} decimals={0} /><span className="ml-1 text-lg sm:text-xl text-white/25 font-normal">B</span><span className="ml-1 text-lg sm:text-xl text-white/25 font-normal">MXN</span></>}
              label="Monto Total Analizado"
              sublabel="Gasto federal identificado"
              borderRight
            />
            <StatCard
              icon={AlertTriangle}
              value={<AnimatedNumber value={stats.porcentaje_opacidad} suffix="%" />}
              label="Adjudicaciones Directas"
              sublabel="Contratos otorgados sin licitación"
              highlight
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  highlight,
  borderRight,
}: {
  icon: typeof FileText;
  value: React.ReactNode;
  label: string;
  sublabel: string;
  highlight?: boolean;
  borderRight?: boolean;
}) {
  return (
    <div className={`group bg-[#0a0a0a] p-6 sm:p-8 pb-10 sm:pb-12 transition-all duration-300 hover:bg-white/[0.02] ${borderRight ? 'sm:border-r sm:border-white/5' : ''}`}>
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] border border-white/5 group-hover:border-white/10 transition-all duration-300">
        <Icon className={`h-4 w-4 ${highlight ? "text-red-400" : "text-white/30"}`} />
      </div>
      <p className={`text-3xl sm:text-5xl font-light tracking-tighter leading-none ${highlight ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
      <p className="mt-3 text-xs font-medium text-white/50 tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-[11px] text-white/25">{sublabel}</p>
    </div>
  );
}
