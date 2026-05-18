"use client";

import { useState, useCallback, useRef, useEffect, useLayoutEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Network, Plus, Minus } from "lucide-react";
import { PanelDetalle } from "@/components/panel-detalle";
import { ScoreBadge } from "@/components/score-badge";
import { Navbar } from "@/components/navbar";

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

function ExploradorContent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [activeRfc, setActiveRfc] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelData, setPanelData] = useState<PanelData | undefined>(undefined);
  const [legendOpen, setLegendOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graphRef = useRef<{
    zoom: (v: number, ms?: number) => void;
    d3Force: (name: string, force?: any) => any;
    d3ReheatSimulation: () => void;
    cooldownTicks: (ticks: number) => void;
    refresh: () => void
  } | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (graphRef.current && graphData) {
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
    <Navbar>
      <div className="relative h-full bg-[#0c0c0c]">
        {/* Leyenda */}
        {graphData && (
          <>
            <div className="hidden md:flex absolute top-3 left-3 items-center gap-2 z-10">
              <LegendBadge color="bg-blue-500/60" label={`Nodos: ${numNodos}`} />
              <LegendBadge color="bg-white/20" label={`Aristas: ${numAristas}`} />
              <LegendBadge color="bg-red-500/60" label="Institución" />
              <LegendBadge color="bg-blue-500/60" label="Proveedor" />
              <LegendBadge color="bg-green-500/60" label="Fantasma" />
            </div>

            <div className="md:hidden absolute top-2 left-2 z-10">
              <button
                onClick={() => setLegendOpen(!legendOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0a0a0a]/80 border border-white/5 backdrop-blur-sm"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500/60" />
                <span className="text-xs font-medium text-white/40">{numNodos} nodos</span>
              </button>
              {legendOpen && (
                <div className="absolute top-full mt-1 left-0 flex flex-col gap-1 bg-[#0a0a0a]/95 border border-white/5 rounded-lg p-2 backdrop-blur-sm min-w-[140px]">
                  <span className="text-[10px] font-semibold text-white/15 uppercase tracking-widest px-1">Leyenda</span>
                  <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-red-500/60" /><span className="text-xs text-white/40">Institución</span></div>
                  <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-blue-500/60" /><span className="text-xs text-white/40">Proveedor</span></div>
                  <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-green-500/60" /><span className="text-xs text-white/40">Fantasma</span></div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Estado vacío */}
        {!graphData && !loadingGraph && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <Network className="w-14 h-14 text-white/5 mb-4" />
            <p className="text-white/30 text-sm font-medium">Busca una empresa o RFC</p>
            <p className="text-white/15 text-xs mt-1">Ej: EDENRED, DANIEL CHARIS, o un RFC directo</p>
          </div>
        )}

        {/* Loading */}
        {loadingGraph && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border border-white/10 rounded-full animate-spin border-t-white/30" />
            <p className="text-sm text-white/30">Cargando grafo...</p>
          </div>
        )}

        {/* Grafo */}
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
            linkColor={() => "rgba(148,163,184,0.15)"}
            linkWidth={(l: any) => Math.max(1, Math.min(3, Math.log((l.num_contratos || 1) + 1) * 0.8))}
            backgroundColor="#0c0c0c"
            onNodeClick={(n: any) => handleNodeClick(n)}
            cooldownTicks={100}
            nodePointerAreaPaint={(node: any, color: string, ctx: any) => {
              const isCentral = node.id === activeRfc;
              const baseRadius = isCentral ? 10 : (node.group === "proveedor" ? 6 : 4);
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, baseRadius + 4, 0, 2 * Math.PI);
              ctx.fill();
            }}
            enableNodeDrag={false}
            nodeCanvasObjectMode={() => "replace"}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const isCentral = node.id === activeRfc;
              const color = nodeColor(node);
              const baseRadius = isCentral ? 10 : (node.group === "proveedor" ? 6 : 4);
              const radius = baseRadius / globalScale;

              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();

              if (isCentral) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + (2 / globalScale), 0, 2 * Math.PI);
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 1.5 / globalScale;
                ctx.stroke();
                ctx.globalAlpha = 1;
              }

              const isZoomedIn = globalScale > 2.5;
              const showText = isCentral || isZoomedIn;
              if (!showText) return;

              const label = node.name.length > 20 ? node.name.slice(0, 18) + "…" : node.name;
              const fontSize = (isCentral ? 14 : 10) / globalScale;

              ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
              ctx.fillStyle = isCentral ? "#ffffff" : "rgba(255,255,255,0.6)";
              ctx.textAlign = "center";
              ctx.fillText(label, node.x, node.y + radius + (4 / globalScale) + fontSize);
            }}
          />
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
          <button onClick={() => zoom(1.5)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0a0a0a] border border-white/5 text-white/30 hover:text-white/70 hover:border-white/15 transition-all duration-300">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => zoom(0.67)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0a0a0a] border border-white/5 text-white/30 hover:text-white/70 hover:border-white/15 transition-all duration-300">
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Panel de detalle */}
        <PanelDetalle open={panelOpen} onOpenChange={setPanelOpen} data={panelData} />
      </div>
    </Navbar>
  );
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a0a0a]/80 border border-white/5 backdrop-blur-sm">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-white/40">{label}</span>
    </div>
  );
}

export default function ExploradorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a] text-white/30 text-sm">
        Cargando...
      </div>
    }>
      <ExploradorContent />
    </Suspense>
  );
}
