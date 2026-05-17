"use client";

import { useState, useCallback, useRef, useEffect, useLayoutEffect, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Search, Network, AlertTriangle, BarChart3, FolderOpen, Plus, Minus, Menu, X } from "lucide-react";
import { PanelDetalle } from "@/components/panel-detalle";
import { ScoreBadge } from "@/components/score-badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://redcontratos-production.up.railway.app";

interface SearchResult {
  rfc: string;
  nombre: string;
  score: number;
  flag_fantasma: boolean;
  flag_fraccionamiento: boolean;
  flag_espejo: boolean;
}

interface GraphNode {
  id: string;
  name: string;
  group: "proveedor" | "institucion";
  score?: number;
  val?: number;
  flags?: { fantasma: boolean; fraccionamiento: boolean; espejo: boolean };
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | any; 
  target: string | any;
  num_contratos: number;
  monto_total: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface PanelData {
  name: string;
  rfc: string;
  type: "proveedor" | "institucion";
  score: number;
  totalContratos: number;
  montoTotal: string;
  dependencias: number;
  pctAdjDirecta: number;
  flags: string[];
}

function Explorador() {
  // Mobile-first responsive layout v2 - 2026-05-16
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [activeRfc, setActiveRfc] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelData, setPanelData] = useState<PanelData | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graphRef = useRef<{
    zoom: (v: number, ms?: number) => void;
    d3Force: (name: string, force?: any) => any;
    d3ReheatSimulation: () => void;
    cooldownTicks: (ticks: number) => void;
    refresh: () => void
  } | null>(null);

  const forcesAppliedRef = useRef(false);
  const searchParams = useSearchParams();

  // Nueva física estable (reemplaza al useLayoutEffect anterior)
  useEffect(() => {
    if (graphRef.current && graphData) {
      // Configuramos las fuerzas nativas sin sobrescribir las instancias de D3
      graphRef.current.d3Force('charge').strength(-400).distanceMax(800);
      graphRef.current.d3Force('link').distance(100);
    }
  }, [graphData]);

  const searchProveedores = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setSearchError(null); return; }
    setLoadingSearch(true);
    setSearchError(null);
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results ?? []);
      if ((data.results ?? []).length === 0) setSearchError("Sin resultados");
    } catch {
      setResults([]);
      setSearchError("Error al conectar con la API");
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProveedores(val), 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchProveedores(query);
    }
    if (e.key === "Escape") setResults([]);
  };

  const loadGraph = useCallback(async (rfc: string) => {
    setResults([]);
    setActiveRfc(rfc);
    setLoadingGraph(true);
    try {
      const res = await fetch(`${API}/graph?rfc=${encodeURIComponent(rfc)}`);
      const data = await res.json();
      if (data.nodes && data.nodes.length > 0) {
        // 🛡️ EL ESCUDO: Eliminar links hacia nodos fantasma antes de dárselos a D3
        const nodeIds = new Set(data.nodes.map((n: any) => n.id));
        data.links = data.links.filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target));
        
        setGraphData(data);
      } else {
        setGraphData(null);
      }
    } catch {
      setGraphData(null);
    } finally {
      setLoadingGraph(false);
    }
  }, []);

  useEffect(() => {
    const rfc = searchParams.get("rfc");
    if (rfc) loadGraph(rfc);
  }, [searchParams, loadGraph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    const nodeLinks = graphData?.links.filter((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return sourceId === node.id || targetId === node.id;
    }) ?? [];

    const totalMonto = nodeLinks.reduce((sum, l) => sum + (l.monto_total || 0), 0);
    
    const formatMonto = (n: number) => {
      if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B MXN`;
      if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M MXN`;
      if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K MXN`;
      return `$${n} MXN`;
    };

    setPanelData({
      name: node.name,
      rfc: node.id,
      type: node.group,
      score: node.score ?? 0,
      totalContratos: nodeLinks.reduce((sum, l) => sum + (l.num_contratos || 0), 0),
      montoTotal: formatMonto(totalMonto),
      dependencias: node.group === "proveedor" ? nodeLinks.length : 1,
      pctAdjDirecta: node.score ? Math.min(node.score, 100) : 0,
      flags: node.flags
        ? [
            node.flags.fantasma ? "Empresa Fantasma" : "",
            node.flags.fraccionamiento ? "Fraccionamiento" : "",
            node.flags.espejo ? "Contrato Espejo" : "",
          ].filter(Boolean)
        : [],
    });
    
    setPanelOpen(true);
    
    if (node.group === "proveedor" && node.id !== activeRfc) {
      loadGraph(node.id);
    }
  }, [graphData, activeRfc, loadGraph]);

  const nodeColor = (node: GraphNode) => {
    if (node.id === activeRfc) return "#3b82f6";
    if (node.flags?.fantasma) return "#22c55e";
    if (node.group === "institucion") return "#ef4444";
    if (node.score && node.score > 70) return "#ef4444";
    if (node.score && node.score >= 40) return "#eab308";
    return "#3b82f6";
  };

  const zoom = (delta: number) => {
    if (graphRef.current) graphRef.current.zoom(delta);
  };

  const numNodos = graphData?.nodes.length ?? 0;
  const numAristas = graphData?.links.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      {/* TOPBAR */}
      <header className="flex items-center h-14 px-3 sm:px-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm shrink-0 z-50">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="relative">
              <Network className="w-6 h-6 text-red-500" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:inline">
              <span className="text-red-500">Red</span>Contratos
            </span>
          </Link>
        </div>

        {/* Search - Desktop */}
        <div className="hidden lg:block flex-1 max-w-2xl mx-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Buscar RFC, empresa o dependencia (Ej. EDENRED)"
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-slate-900 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
            />
          </div>
          {(results.length > 0 || loadingSearch || searchError) && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
              {loadingSearch && <div className="px-4 py-3 text-sm text-slate-400">Buscando...</div>}
              {searchError && !loadingSearch && <div className="px-4 py-3 text-sm text-red-400">{searchError}</div>}
              {results.map((r) => (
                <button
                  key={r.rfc}
                  onClick={() => { setQuery(r.nombre); loadGraph(r.rfc); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-white truncate">{r.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{r.rfc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    {r.flag_fantasma && <FlagBadge label="👻" title="Empresa fantasma" />}
                    {r.flag_fraccionamiento && <FlagBadge label="✂️" title="Fraccionamiento" />}
                    {r.flag_espejo && <FlagBadge label="🪞" title="Contrato espejo" />}
                    <ScoreBadge score={r.score} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile: Search toggle */}
        <div className="lg:hidden ml-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Buscar"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-red-500/30 bg-red-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-medium text-red-400 hidden sm:inline">Live</span>
          </div>
        </div>

        {/* Desktop: Live Badge */}
        <div className="hidden lg:flex items-center gap-1.5 ml-auto shrink-0 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-400">Live: CompraNet 2026</span>
        </div>
      </header>

      {/* Mobile: Search bar expandable */}
      {searchOpen && (
        <div className="lg:hidden px-3 py-2 border-b border-white/10 bg-slate-950">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Buscar RFC, empresa..."
              autoFocus
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-slate-900 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
            />
          </div>
          {(results.length > 0 || loadingSearch || searchError) && (
            <div className="mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
              {loadingSearch && <div className="px-4 py-3 text-sm text-slate-400">Buscando...</div>}
              {searchError && !loadingSearch && <div className="px-4 py-3 text-sm text-red-400">{searchError}</div>}
              {results.map((r) => (
                <button
                  key={r.rfc}
                  onClick={() => { setQuery(r.nombre); loadGraph(r.rfc); setSearchOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{r.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{r.rfc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {r.flag_fantasma && <FlagBadge label="👻" title="Empresa fantasma" />}
                    <ScoreBadge score={r.score} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-52 shrink-0 border-r border-white/10 bg-slate-950 flex-col py-4">
          <nav className="flex flex-col gap-1 px-2">
            <SidebarLink icon={Network} label="Explorador de Grafos" active />
            <Link href="/top">
              <SidebarLink icon={AlertTriangle} label="Top Riesgo" />
            </Link>
            <Link href="/alertas">
              <SidebarLink icon={AlertTriangle} label="Alertas Activas" />
            </Link>
            <Link href="/estadisticas">
              <SidebarLink icon={BarChart3} label="Estadísticas" />
            </Link>
            <SidebarLink icon={FolderOpen} label="Casos Detectados" />
          </nav>
        </aside>

        {/* MAIN */}
        <main className="flex-1 relative overflow-hidden bg-slate-900 lg:m-2 lg:rounded-lg lg:border lg:border-white/10">
          {/* Leyenda - Desktop */}
          {graphData && (
            <>
              <div className="hidden md:flex absolute top-3 left-3 items-center gap-2 z-10">
                <LegendBadge color="bg-blue-500" label={`Nodos: ${numNodos}`} />
                <LegendBadge color="bg-slate-500" label={`Aristas: ${numAristas}`} />
                <LegendBadge color="bg-red-500" label="Institución" />
                <LegendBadge color="bg-blue-500" label="Proveedor" />
                <LegendBadge color="bg-green-500" label="Fantasma" />
              </div>

              {/* Leyenda - Mobile (collapsible) */}
              <div className="md:hidden absolute top-2 left-2 z-10">
                <button
                  onClick={() => setLegendOpen(!legendOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium text-slate-300">{numNodos} nodos</span>
                </button>
                {legendOpen && (
                  <div className="absolute top-full mt-1 left-0 flex flex-col gap-1 bg-slate-900/95 border border-white/10 rounded-lg p-2 backdrop-blur-sm min-w-[140px]">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase px-1">Leyenda</span>
                    <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-slate-300">Institución</span></div>
                    <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-xs text-slate-300">Proveedor</span></div>
                    <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs text-slate-300">Fantasma</span></div>
                    <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-xs text-slate-300">Score 40-70</span></div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Estado vacío */}
          {!graphData && !loadingGraph && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <Network className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-slate-400 text-base font-medium">Busca una empresa o RFC</p>
              <p className="text-slate-600 text-sm mt-1">Ej: EDENRED, DANIEL CHARIS, o un RFC directo</p>
            </div>
          )}

          {/* Loading grafo */}
          {loadingGraph && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Cargando grafo...</p>
            </div>
          )}

          {/* Grafo real */}
          {graphData && !loadingGraph && (
            <ForceGraph2D
              key={activeRfc}
              ref={graphRef as any}
              graphData={graphData}
              nodeLabel={(n: any) => n.name.length > 25 ? n.name.slice(0, 23) + "…" : n.name}
              nodeColor={nodeColor as any}
              nodeVal={(n: any) => {
                if (n.id === activeRfc) return 12;
                if (n.group === "proveedor") return 8;
                return 6;
              }}
              nodeRelSize={10}
              linkColor={() => "rgba(148,163,184,0.25)"}
              linkWidth={(l: any) => Math.max(1, Math.min(3, Math.log((l.num_contratos || 1) + 1) * 0.8))}
              backgroundColor="#0f172a"
              onNodeClick={(n: any) => handleNodeClick(n)}
              
              // FÍSICA CORREGIDA: Sin temblores ni crashes
              cooldownTicks={100} 
              
              nodePointerAreaPaint={(node: any, color: string, ctx: any) => {
                const r = (node.val ?? 6) * 10;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fill();
              }}
              nodeCanvasObjectMode={() => "replace"}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const isCentral = node.id === activeRfc;
                const color = nodeColor(node);
                const baseRadius = isCentral ? 16 : (node.group === "proveedor" ? 12 : 8);
                const radius = baseRadius / globalScale;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + (2 / globalScale), 0, 2 * Math.PI);
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();
                ctx.globalAlpha = 1;
                const label = node.name.length > 20 ? node.name.slice(0, 18) + "…" : node.name;
                const fontSize = Math.max(8, Math.min(11, 10 / globalScale));
                ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
                ctx.fillStyle = "rgba(255,255,255,0.85)";
                ctx.textAlign = "center";
                ctx.fillText(label, node.x, node.y + radius + fontSize + (8 / globalScale));
              }}
            />
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
            <button onClick={() => zoom(1.5)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => zoom(0.67)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all">
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 bg-slate-950 border-r border-white/10 text-white p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
            <Network className="w-6 h-6 text-red-500" />
            <span className="text-lg font-bold tracking-tight">
              <span className="text-red-500">Red</span>Contratos
            </span>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4">
            <SheetLink icon={Network} label="Explorador de Grafos" active onClick={() => setSidebarOpen(false)} />
            <SheetLink icon={AlertTriangle} label="Top Riesgo" href="/top" onClick={() => setSidebarOpen(false)} />
            <SheetLink icon={AlertTriangle} label="Alertas Activas" href="/alertas" onClick={() => setSidebarOpen(false)} />
            <SheetLink icon={BarChart3} label="Estadísticas" href="/estadisticas" onClick={() => setSidebarOpen(false)} />
            <SheetLink icon={FolderOpen} label="Casos Detectados" onClick={() => setSidebarOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      {/* Panel de detalle */}
      <PanelDetalle open={panelOpen} onOpenChange={setPanelOpen} data={panelData} />
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, badge }: {
  icon: typeof Network;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
      active ? "bg-red-500/10 text-red-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"
    }`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-[10px] font-medium text-red-400">
          {badge}
        </span>
      )}
    </div>
  );
}

function SheetLink({ icon: Icon, label, active, href, onClick }: {
  icon: typeof Network;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all cursor-pointer ${
        active ? "bg-red-500/10 text-red-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-sm">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-300">{label}</span>
    </div>
  );
}

function FlagBadge({ label, title }: { label: string; title: string }) {
  return <span title={title} className="text-sm">{label}</span>;
}

export default function ExploradorPage() {
  return (
    <Suspense fallback={null}>
      <Explorador />
    </Suspense>
  );
}