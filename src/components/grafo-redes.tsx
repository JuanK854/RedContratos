"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const MOCK_DATA = {
  nodes: [
    { id: "edenred", name: "EDENRED MEXICO SA DE CV", type: "proveedor", val: 12 },
    { id: "slycom", name: "Slycom", type: "proveedor", fantasma: true, val: 8 },
    { id: "kol-tov", name: "Kol-Tov", type: "proveedor", fantasma: true, val: 7 },
    { id: "birmex", name: "BIRMEX", type: "institucion", val: 10 },
    { id: "salud", name: "Secretaría de Salud", type: "institucion", val: 9 },
    { id: "imss", name: "IMSS", type: "institucion", val: 8 },
    { id: "indaabin", name: "INDAABIN", type: "institucion", val: 7 },
    { id: "semar", name: "SEMAR", type: "institucion", val: 6 },
    { id: "sedena", name: "SEDENA", type: "institucion", val: 6 },
    { id: "agn", name: "AGROASEMEX SA", type: "proveedor", val: 10 },
    { id: "jetvan", name: "JET VAN CAR RENTAL", type: "proveedor", val: 8 },
    { id: "biometria", name: "Biometría Aplicada", type: "proveedor", fantasma: true, val: 6 },
    { id: "safar", name: "José Safar Boueri", type: "proveedor", fantasma: true, val: 5 },
  ],
  links: [
    { source: "edenred", target: "salud", value: 3 },
    { source: "edenred", target: "imss", value: 2 },
    { source: "edenred", target: "birmex", value: 2 },
    { source: "edenred", target: "semar", value: 1 },
    { source: "edenred", target: "sedena", value: 1 },
    { source: "slycom", target: "birmex", value: 2 },
    { source: "slycom", target: "salud", value: 1 },
    { source: "kol-tov", target: "imss", value: 2 },
    { source: "kol-tov", target: "birmex", value: 1 },
    { source: "agn", target: "salud", value: 2 },
    { source: "agn", target: "semar", value: 1 },
    { source: "jetvan", target: "sedena", value: 2 },
    { source: "jetvan", target: "semar", value: 1 },
    { source: "biometria", target: "birmex", value: 1 },
    { source: "safar", target: "indaabin", value: 1 },
    { source: "safar", target: "salud", value: 1 },
  ],
};

export function GrafoRedes() {
  const graphData = useMemo(() => MOCK_DATA, []);

  const nodeColor = (node: { fantasma?: boolean; type?: string }) => {
    if (node.fantasma) return "#22c55e";
    if (node.type === "proveedor") return "#3b82f6";
    if (node.type === "institucion") return "#ef4444";
    return "#94a3b8";
  };

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
    </div>
  );
}
