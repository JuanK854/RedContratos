import Link from "next/link";
import { Network, AlertTriangle, BarChart3, FolderOpen } from "lucide-react";
import { Buscador } from "@/components/buscador";
import { GrafoRedes } from "@/components/grafo-redes";

export default function ExploradorPage() {
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
        <main className="flex-1 relative overflow-hidden rounded-lg m-2 border border-white/10">
          <GrafoRedes />
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
