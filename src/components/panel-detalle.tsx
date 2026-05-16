"use client";

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
  contratosRecientes: [
    {
      num: "CN-2026-000001",
      dependencia: "Secretaría de Salud",
      tipo: "Adjudicación Directa",
      monto: "$5.2M",
    },
    {
      num: "CN-2026-000042",
      dependencia: "IMSS",
      tipo: "Adjudicación Directa",
      monto: "$12.8M",
    },
    {
      num: "CN-2026-000087",
      dependencia: "BIRMEX",
      tipo: "Adjudicación Directa",
      monto: "$3.1M",
    },
  ],
};

interface PanelDetalleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: NodeDetail;
}

export function PanelDetalle({ open, onOpenChange, data = MOCK_DATA }: PanelDetalleProps) {
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

          {/* Información de la Entidad */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Información de la Entidad
            </h3>
            <div className="space-y-2">
              <InfoRow icon={MapPin} label="Dirección" value={data.direccion || "No disponible"} />
              <InfoRow icon={Users} label="Representante" value="No disponible" />
              <InfoRow icon={Calendar} label="Registrado" value={data.registrado || "No disponible"} />
            </div>
          </div>

          {/* Contratos Recientes */}
          {data.contratosRecientes && data.contratosRecientes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Contratos Recientes
              </h3>
              <div className="space-y-2">
                {data.contratosRecientes.map((c) => (
                  <div
                    key={c.num}
                    className="rounded-lg border border-white/10 bg-slate-900/50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[10px] text-slate-500">{c.num}</p>
                        <p className="text-sm text-slate-200">{c.dependencia}</p>
                        <span className="mt-1 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                          {c.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{c.monto}</span>
                        <ExternalLink className="h-3 w-3 text-slate-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Ver Todos los Contratos
          </Button>
          <Button className="flex-1 bg-red-600 text-white hover:bg-red-500">
            <Sparkles className="mr-2 h-4 w-4" />
            Analizar con IA
          </Button>
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

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-slate-600" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-300">{value}</p>
      </div>
    </div>
  );
}
