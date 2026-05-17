"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

// Apuntando a tu backend en Railway
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://web-production-bb601f.up.railway.app";

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p>Cargando el historial de contratos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      {/* Botón para regresar al explorador */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
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
          <p className="font-mono text-slate-400">RFC: {rfc}</p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">ID Contrato / Código</th>
                <th className="px-6 py-4 font-medium">Institución</th>
                <th className="px-6 py-4 font-medium">Procedimiento</th>
                <th className="px-6 py-4 font-medium text-right">Monto (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contratos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron contratos para este RFC o el endpoint no está disponible.
                  </td>
                </tr>
              ) : (
                contratos.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{c.id_contrato}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{c.institucion}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] text-slate-300 border border-white/10">
                        {c.tipo_procedimiento}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white text-right">
                      ${Number(c.monto || 0).toLocaleString('es-MX')}
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