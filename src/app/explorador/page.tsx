import Link from "next/link";
import { Network, AlertTriangle, BarChart3, FolderOpen, Plus, Minus } from "lucide-react";
import { Buscador } from "@/components/buscador";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      {/* TOPBAR */}
      <header className="flex items-center h-14 px-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm shrink-0 z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 w-52 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="relative">
            <Network className="w-6 h-6 text-red-500" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-red-500">Red</span>Contratos
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-auto">
          <Buscador />
        </div>

        {/* Live Badge */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
          <span className="text-xs font-medium text-red-400">Live: CompraNet 2026</span>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-52 shrink-0 border-r border-white/10 bg-slate-950 flex flex-col py-4">
          <nav className="flex flex-col gap-1 px-2">
            <SidebarLink icon={Network} label="Explorador de Grafos" active />
            <SidebarLink icon={AlertTriangle} label="Alertas Activas" badge="12" />
            <SidebarLink icon={BarChart3} label="Estadísticas" />
            <SidebarLink icon={FolderOpen} label="Casos Detectados" badge="3" />
          </nav>
        </aside>

        {/* MAIN CONTENT - Graph Canvas */}
        <main className="flex-1 relative grid-bg overflow-hidden rounded-lg m-2 border border-white/10">
          {/* Legend Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <LegendBadge color="bg-red-500" label="Nodos: 215" />
            <LegendBadge color="bg-slate-500" label="Aristas: 439" />
            <LegendBadge color="bg-red-500" label="Volumen: $6.8B MXN" />
          </div>

          {/* Graph Placeholder */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Mock graph visualization */}
            <div className="relative w-64 h-48">
              {/* Center node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-500 shadow-lg shadow-red-500/40 z-10" />
              {/* Surrounding nodes */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-600" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-600" />
              <div className="absolute top-1/2 left-4 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700" />
              <div className="absolute top-1/2 right-4 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700" />
              <div className="absolute top-8 left-8 w-4 h-4 rounded-full bg-slate-600" />
              <div className="absolute top-8 right-8 w-4 h-4 rounded-full bg-slate-600" />
              <div className="absolute bottom-8 left-12 w-3 h-3 rounded-full bg-red-700" />
              <div className="absolute bottom-8 right-12 w-4 h-4 rounded-full bg-slate-600" />
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="90%" y2="50%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="15%" y2="15%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="85%" y2="15%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="20%" y2="85%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="80%" y2="85%" stroke="white" strokeWidth="1" />
              </svg>
            </div>
            <p className="mt-8 text-sm text-slate-500 font-mono">Canvas placeholder for react-force-graph-2d</p>
            <p className="mt-1 text-xs text-slate-600">Selecciona un nodo para ver detalles</p>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
            <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
              <Plus className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: typeof Network;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <button
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
        active
          ? "bg-red-500/10 text-red-400 font-medium"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-[10px] font-medium text-red-400">
          {badge}
        </span>
      )}
    </button>
  );
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-sm">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-300">{label}</span>
    </div>
  );
}
