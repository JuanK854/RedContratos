import Link from "next/link";
import { Search, Network, Bell, BarChart3, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, RFC o dependencia..."
                className="w-full h-10 pl-10 pr-16 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-800 border border-white/10">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            <Link href="/alertas" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
            </Link>
            <Link href="/estadisticas" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </Link>
            <Link
              href="/explorador"
              className="flex items-center gap-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              Explorar Grafo
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-4 py-1.5">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Plataforma de Inteligencia Anticorrupción</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">Transparencia en la</span>
            <br />
            <span className="text-red-500">Contratación Pública</span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Analiza redes de contratistas, detecta patrones de riesgo y explora
            conexiones ocultas en los contratos del gobierno federal mexicano.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/explorador"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-500 transition-colors"
            >
              Explorar el Grafo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-base font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Ver Documentación
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            value="34,486"
            label="Total de Contratos"
            sublabel="Dataset CompraNet 2026"
          />
          <StatCard
            value="$300B+ MXN"
            label="Monto Total Analizado"
            sublabel="Gasto federal identificado"
          />
          <StatCard
            value="76%"
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
  value,
  label,
  sublabel,
  highlight,
}: {
  value: string;
  label: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-red-500/50 hover:bg-slate-900">
      <p className={`text-5xl font-bold tracking-tight ${highlight ? "text-red-500" : "text-white"}`}>
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-300">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}
