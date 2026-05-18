"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar } from "lucide-react";

// Apuntando a tu backend en Railway
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://redcontratos-production.up.railway.app";

export default function ContratosPage() {
  const params = useParams();
  const router = useRouter();
  const rfc = params.rfc as string;

  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rfc) return;
    
    // Llamada a tu endpoint del backend
    fetch(`${API_URL}/contratos/${rfc}`)
      .then((res) => res.json())
      .then((data) => {
        setContratos(data.contratos || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando contratos:", err);
        setLoading(false);
      });
  }, [rfc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white/40">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p>Cargando el historial de contratos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      {/* Botón para regresar al explorador */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la Red
      </button>

      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
          <FileText className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Historial de Contratos</h1>
          <p className="font-mono text-white/40">RFC: {rfc}</p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.03] text-white/40 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">ID / Código</th>
                <th className="px-6 py-4 font-medium">Institución</th>
                <th className="px-6 py-4 font-medium">Procedimiento</th>
                <th className="px-6 py-4 font-medium">Fecha de Inicio</th>
                <th className="px-6 py-4 font-medium">Fecha de Fin</th> {/* NUEVA COLUMNA */}
                <th className="px-6 py-4 font-medium text-right">Monto (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contratos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/30">
                    No se encontraron contratos para este RFC o el endpoint no está disponible.
                  </td>
                </tr>
              ) : (
                contratos.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    {/* ID del Contrato */}
                    <td className="px-6 py-4 font-mono text-xs text-white/40">
                      {c.num_contrato || "SIN CÓDIGO"}
                    </td>
                    
                    {/* Institución */}
                    <td className="px-6 py-4 font-medium text-white/80">
                      <div className="max-w-xs truncate" title={c.institucion}>
                        {c.institucion}
                      </div>
                    </td>
                    
                    {/* Procedimiento */}
                    <td className="px-6 py-4">
                      <span className="inline-flex max-w-[200px] truncate rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/60 border border-white/5" title={c.tipo_procedimiento || "NO ESPECIFICADO"}>
                        {c.tipo_procedimiento || "NO ESPECIFICADO"}
                      </span>
                    </td>

                    {/* Fecha de Inicio */}
                    <td className="px-6 py-4 text-white/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-white/30" />
                        {c.fecha_inicio || "N/A"}
                      </div>
                    </td>

                    {/* Fecha de Fin (NUEVA CELDA) */}
                    <td className="px-6 py-4 text-white/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-white/30" />
                        {c.fecha_fin || "N/A"}
                      </div>
                    </td>
                    
                    {/* Monto */}
                    <td className="px-6 py-4 font-semibold text-white text-right">
                      ${Number(c.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}