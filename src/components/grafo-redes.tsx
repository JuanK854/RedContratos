"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useCallback } from "react";
import { PanelDetalle } from "./panel-detalle";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const NODE_DETAILS: Record<string, {
  name: string;
  rfc: string;
  type: "proveedor" | "institucion";
  score: number;
  totalContratos: number;
  montoTotal: string;
  dependencias: number;
  pctAdjDirecta: number;
  flags: string[];
  direccion?: string;
  registrado?: string;
  contratosRecientes?: { num: string; dependencia: string; tipo: string; monto: string }[];
}> = {
  edenred: {
    name: "EDENRED MEXICO SA DE CV",
    rfc: "EME980311H54",
    type: "proveedor",
    score: 92,
    totalContratos: 439,
    montoTotal: "$6.8B MXN",
    dependencias: 215,
    pctAdjDirecta: 98,
    flags: ["Fraccionamiento", "Renovación Espejo", "Empresa Fantasma"],
    registrado: "2026-01-15",
    contratosRecientes: [
      { num: "CN-2026-000001", dependencia: "Secretaría de Salud", tipo: "Adjudicación Directa", monto: "$5.2M" },
      { num: "CN-2026-000042", dependencia: "IMSS", tipo: "Adjudicación Directa", monto: "$12.8M" },
      { num: "CN-2026-000087", dependencia: "BIRMEX", tipo: "Adjudicación Directa", monto: "$3.1M" },
    ],
  },
  slycom: {
    name: "Slycom",
    rfc: "SLY260101XX1",
    type: "proveedor",
    score: 88,
    totalContratos: 12,
    montoTotal: "$1.2B MXN",
    dependencias: 8,
    pctAdjDirecta: 100,
    flags: ["Empresa Fantasma", "Adjudicación Directa"],
    registrado: "2026-02-01",
  },
  birmex: {
    name: "BIRMEX",
    rfc: "BIR000101000",
    type: "institucion",
    score: 45,
    totalContratos: 87,
    montoTotal: "$2.1B MXN",
    dependencias: 1,
    pctAdjDirecta: 30,
    flags: [],
  },
  salud: {
    name: "Secretaría de Salud",
    rfc: "SSA000101000",
    type: "institucion",
    score: 35,
    totalContratos: 234,
    montoTotal: "$15.3B MXN",
    dependencias: 1,
    pctAdjDirecta: 22,
    flags: [],
  },
  imss: {
    name: "IMSS",
    rfc: "IMS431231ABC",
    type: "institucion",
    score: 28,
    totalContratos: 567,
    montoTotal: "$45.2B MXN",
    dependencias: 1,
    pctAdjDirecta: 18,
    flags: [],
  },
  kolTov: {
    name: "Kol-Tov",
    rfc: "KOL260315YY2",
    type: "proveedor",
    score: 85,
    totalContratos: 8,
    montoTotal: "$890M MXN",
    dependencias: 5,
    pctAdjDirecta: 100,
    flags: ["Empresa Fantasma"],
    registrado: "2026-03-15",
  },
  agn: {
    name: "AGROASEMEX SA",
    rfc: "AGR850601XX1",
    type: "proveedor",
    score: 72,
    totalContratos: 251,
    montoTotal: "$6.5B MXN",
    dependencias: 195,
    pctAdjDirecta: 65,
    flags: ["Concentración Masiva"],
  },
  jetvan: {
    name: "JET VAN CAR RENTAL",
    rfc: "JVC190415ZZ2",
    type: "proveedor",
    score: 78,
    totalContratos: 38,
    montoTotal: "$2.8B MXN",
    dependencias: 38,
    pctAdjDirecta: 89,
    flags: ["Concentración Masiva"],
  },
  biometria: {
    name: "Biometría Aplicada",
    rfc: "BIA260420ZZ3",
    type: "proveedor",
    score: 90,
    totalContratos: 5,
    montoTotal: "$450M MXN",
    dependencias: 3,
    pctAdjDirecta: 100,
    flags: ["Empresa Fantasma", "Adjudicación Directa"],
    registrado: "2026-04-20",
  },
  safar: {
    name: "José Safar Boueri",
    rfc: "SABJ850101XX4",
    type: "proveedor",
    score: 82,
    totalContratos: 3,
    montoTotal: "$120M MXN",
    dependencias: 2,
    pctAdjDirecta: 100,
    flags: ["Empresa Fantasma"],
    registrado: "2026-01-10",
  },
  indaabin: {
    name: "INDAABIN",
    rfc: "INA000101000",
    type: "institucion",
    score: 55,
    totalContratos: 142,
    montoTotal: "$8.7B MXN",
    dependencias: 1,
    pctAdjDirecta: 45,
    flags: ["Fraccionamiento Detectado"],
  },
  semar: {
    name: "SEMAR",
    rfc: "SEM000101000",
    type: "institucion",
    score: 30,
    totalContratos: 89,
    montoTotal: "$5.4B MXN",
    dependencias: 1,
    pctAdjDirecta: 25,
    flags: [],
  },
  sedena: {
    name: "SEDENA",
    rfc: "SED000101000",
    type: "institucion",
    score: 32,
    totalContratos: 156,
    montoTotal: "$12.1B MXN",
    dependencias: 1,
    pctAdjDirecta: 28,
    flags: [],
  },
};

const GRAPH_DATA = {
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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const nodeColor = useCallback((node: { fantasma?: boolean; type?: string }) => {
    if (node.fantasma) return "#22c55e";
    if (node.type === "proveedor") return "#3b82f6";
    if (node.type === "institucion") return "#ef4444";
    return "#94a3b8";
  }, []);

  const handleNodeClick = useCallback((node: { id: string }) => {
    setSelectedNode(node.id);
    setPanelOpen(true);
  }, []);

  const detailData = selectedNode ? NODE_DETAILS[selectedNode] : undefined;

  return (
    <div className="relative w-full h-full">
      <ForceGraph2D
        graphData={GRAPH_DATA}
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
          <span className="text-xs font-semibold text-white">{GRAPH_DATA.nodes.length}</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5">
          <span className="text-xs text-slate-400">Conexiones: </span>
          <span className="text-xs font-semibold text-white">{GRAPH_DATA.links.length}</span>
        </div>
      </div>

      {/* Panel de detalle */}
      <PanelDetalle
        open={panelOpen}
        onOpenChange={setPanelOpen}
        data={detailData}
      />
    </div>
  );
}
