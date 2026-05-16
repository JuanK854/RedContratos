"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useCallback, useEffect } from "react";
import { PanelDetalle } from "./panel-detalle";
import { API_URL } from "@/lib/config";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
  id: string;
  name: string;
  group: string;
  score?: number;
  val: number;
  flags?: { fantasma: boolean; fraccionamiento: boolean; espejo: boolean };
}

interface GraphLink {
  source: string;
  target: string;
  num_contratos: number;
  monto_total: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const DEFAULT_RFC = "EME980311H54";

export function GrafoRedes() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async (rfc: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/graph?rfc=${encodeURIComponent(rfc)}`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch {
      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph(DEFAULT_RFC);
  }, [fetchGraph]);

  const nodeColor = useCallback((node: GraphNode) => {
    if (node.flags?.fantasma) return "#22c55e";
    if (node.group === "proveedor") return "#3b82f6";
    if (node.group === "institucion") return "#ef4444";
    return "#94a3b8";
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node.id);
    setPanelOpen(true);
  }, []);

  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return undefined;
    const node = graphData.nodes.find((n) => n.id === selectedNode);
    if (!node) return undefined;

    const nodeLinks = graphData.links.filter(
      (l) => l.source === selectedNode || l.target === selectedNode
    );
    const totalMonto = nodeLinks.reduce((sum, l) => sum + (l.monto_total || 0), 0);

    const formatMonto = (n: number) => {
      if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B MXN`;
      if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M MXN`;
      if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K MXN`;
      return `$${n} MXN`;
    };

    return {
      name: node.name,
      rfc: node.id,
      type: node.group === "proveedor" ? "proveedor" : "institucion",
      score: node.score || 0,
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
    };
  }, [selectedNode, graphData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-950">
        <div className="text-slate-500 text-sm">Cargando grafo...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ForceGraph2D
        graphData={graphData}
        backgroundColor="#0f172a"
        nodeColor={nodeColor as (node: object) => string}
        nodeLabel="name"
        nodeVal="val"
        linkColor="rgba(255,255,255,0.2)"
        linkWidth={1}
        nodeRelSize={5}
        cooldownTicks={100}
        onNodeClick={handleNodeClick}
        nodeCanvasObjectMode={() => "after"}
      />

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-sm p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Leyenda</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-slate-300">Institución</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-300">Proveedor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-slate-300">Empresa Fantasma</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5">
          <span className="text-xs text-slate-400">Nodos: </span>
          <span className="text-xs font-semibold text-white">{graphData.nodes.length}</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5">
          <span className="text-xs text-slate-400">Conexiones: </span>
          <span className="text-xs font-semibold text-white">{graphData.links.length}</span>
        </div>
      </div>

      {/* Panel de detalle */}
      <PanelDetalle
        open={panelOpen}
        onOpenChange={setPanelOpen}
        data={selectedNodeData}
      />
    </div>
  );
}
