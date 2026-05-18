"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { ScoreBadge, getScoreInfo } from "@/components/score-badge";
import {
  FileText,
  DollarSign,
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
}

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
};

interface PanelDetalleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: NodeDetail;
}

export function PanelDetalle({ open, onOpenChange, data = MOCK_DATA }: PanelDetalleProps) {
  const scoreInfo = getScoreInfo(data.score);

  const adjColor =
    data.pctAdjDirecta >= 80 ? "text-red-400/70" : data.pctAdjDirecta >= 50 ? "text-yellow-400/70" : "text-green-400/70";

  const adjLabel =
    data.pctAdjDirecta >= 80 ? "Nivel crítico" : data.pctAdjDirecta >= 50 ? "Nivel alto" : "Nivel aceptable";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:w-[540px] bg-[#0a0a0a] border-l border-white/5 text-white p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-white/5 px-6 py-4 pr-12">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] border border-white/5">
            <FileText className="h-5 w-5 text-white/30" />
          </div>
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-base font-medium text-white/90">{data.name}</SheetTitle>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-white/[0.03] border border-white/5 px-2 py-0.5 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                {data.type}
              </span>
              <span className="font-mono text-xs text-white/15">{data.rfc}</span>
              <ScoreBadge score={data.score} size="sm" />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Score Card */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-widest">Score de Riesgo</p>
              <p className={`text-lg font-medium mt-1 ${scoreInfo.textColor}`}>{scoreInfo.label}</p>
            </div>
            <ScoreBadge score={data.score} size="lg" />
          </div>

          {/* Stats Cards - Bento */}
          <div className="grid grid-cols-2 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/5">
            <StatCard icon={FileText} label="Total Contratos" value={data.totalContratos.toString()} borderRight />
            <StatCard icon={DollarSign} label="Monto Total" value={data.montoTotal} />
          </div>

          {/* Adjudicación Directa */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/30 tracking-wide uppercase">Adjudicación Directa</span>
              <span className={`text-xl font-light tracking-tight tabular-nums ${adjColor}`}>{data.pctAdjDirecta}%</span>
            </div>
            <Progress value={data.pctAdjDirecta} className="h-1.5 bg-white/5" indicatorClassName="bg-red-500/60" />
            <p className="mt-2 text-xs text-white/20">{adjLabel}</p>
          </div>

          {/* Información de la Entidad */}
          <div>
            <h3 className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-3">
              Detalles de la Red
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-white/15">RFC / Identificador</p>
                <p className="font-mono text-sm text-white/50 mt-0.5">{data.rfc}</p>
              </div>
              <div>
                <p className="text-xs text-white/15">Dependencias afectadas</p>
                <p className="text-sm text-white/50 mt-0.5">{data.dependencias} instituciones vinculadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — solo para proveedores */}
        {data.type === "proveedor" && (
          <div className="border-t border-white/5 px-6 py-4 flex gap-2">
            <Link
              href={`/contratos/${data.rfc}`}
              className="flex-1 inline-flex items-center justify-center rounded-md border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              Ver Todos
            </Link>

            <Link
              href={`/caso/${data.rfc}`}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-white/90 transition-all duration-300"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analizar con IA
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  borderRight,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  borderRight?: boolean;
}) {
  return (
    <div className={`bg-[#0a0a0a] p-4 ${borderRight ? 'border-r border-white/5' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-white/15" />
        <span className="text-[10px] text-white/25 tracking-wide uppercase">{label}</span>
      </div>
      <p className="text-xl font-light tracking-tight text-white/80 tabular-nums">{value}</p>
    </div>
  );
}
