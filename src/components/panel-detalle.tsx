"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreBadge, getScoreInfo } from "@/components/score-badge";
import {
  FileText,
  DollarSign,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  Sparkles,
  Network
} from "lucide-react";

interface NodeDetail {
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
  contratosRecientes?: {
    num: string;
    dependencia: string;
    tipo: string;
    monto: string;
  }[];
}

<<<<<<< HEAD
=======
const MOCK_DATA: NodeDetail = {
  name: "EDENRED MEXICO SA DE CV",
  rfc: "EME980311H54",
  type: "proveedor",
  score: 92,
  totalContratos: 439,
  montoTotal: "$6.8B MXN",
  dependencias: 215,
  pctAdjDirecta: 98,
  flags: ["Fraccionamiento", "Renovación Espejo", "Empresa Fantasma"],
  direccion: "No disponible",
  registrado: "2026-01-15",
};

>>>>>>> saul
interface PanelDetalleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: NodeDetail;
}

export function PanelDetalle({ open, onOpenChange, data }: PanelDetalleProps) {
  if (!data) return null;
  const scoreInfo = getScoreInfo(data.score);

  const adjColor =
    data.pctAdjDirecta >= 80 ? "text-red-500" : data.pctAdjDirecta >= 50 ? "text-yellow-500" : "text-green-500";

  const adjLabel =
    data.pctAdjDirecta >= 80 ? "Nivel crítico" : data.pctAdjDirecta >= 50 ? "Nivel alto" : "Nivel aceptable";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:w-[540px] bg-slate-950 border-l border-white/10 text-white p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-white/10 px-6 py-4 pr-12">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-base font-bold text-white">{data.name}</SheetTitle>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 uppercase">
                {data.type}
              </span>
              <span className="font-mono text-xs text-slate-500">{data.rfc}</span>
              <ScoreBadge score={data.score} size="sm" />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Score Card */}
          <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Score de Riesgo</p>
              <p className={`text-lg font-bold ${scoreInfo.textColor}`}>{scoreInfo.label}</p>
            </div>
            <ScoreBadge score={data.score} size="lg" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={FileText} label="Total Contratos" value={data.totalContratos.toString()} />
            <StatCard icon={DollarSign} label="Monto Total" value={data.montoTotal} />
          </div>

          {/* Adjudicación Directa */}
          <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Adjudicación Directa</span>
              <span className={`text-lg font-bold ${adjColor}`}>{data.pctAdjDirecta}%</span>
            </div>
            <Progress value={data.pctAdjDirecta} className="h-2 bg-slate-800" indicatorClassName="bg-red-500" />
            <p className="mt-2 text-xs text-slate-500">{adjLabel}</p>
          </div>

          {/* Información de la Entidad (ACTUALIZADO PARA DATOS REALES) */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Detalles de la Red
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-slate-500">RFC / Identificador</p>
                <p className="font-mono text-sm text-slate-300">{data.rfc}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Dependencias afectadas</p>
                <p className="text-sm text-slate-300">{data.dependencias} instituciones vinculadas</p>
              </div>
              
              {/* Solo mostramos las banderas si tiene al menos una */}
              {data.flags && data.flags.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Banderas de Riesgo Detectadas</p>
                  <div className="flex flex-wrap gap-2">
                    {data.flags.map((flag, index) => (
                      <span key={index} className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/20">
                        🚨 {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

       {/* Footer Restaurado (Solución a prueba de TypeScript) */}
        <div className="border-t border-white/10 px-6 py-4 flex gap-2">
          {/* Botón original: Ver Todos los Contratos */}
          <Link 
            href={`/contratos/${data.rfc}`}
            className="flex-1 inline-flex items-center justify-center rounded-md border border-red-500/50 bg-transparent px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <FileText className="mr-2 h-4 w-4" />
            Ver Todos
          </Link>

          {/* Botón que lleva a la página de Análisis de IA (Caso) */}
          <Link 
            href={`/caso/${data.rfc}`}
            className="flex-1 inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors shadow-sm"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Analizar con IA
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}