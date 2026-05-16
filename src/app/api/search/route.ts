import { NextResponse } from "next/server";

const DATA = [
  { id: "1", name: "EDENRED MEXICO SA DE CV", rfc: "EME980311H54", type: "empresa", description: "Servicios de vales de despensa" },
  { id: "2", name: "GRUPO CONSTRUCTOR ROJAS SA", rfc: "GCR901215AB1", type: "empresa", description: "Construcción e infraestructura" },
  { id: "3", name: "Secretaría de Salud", rfc: "SSA000101000", type: "dependencia", description: "Gobierno Federal" },
  { id: "4", name: "TECNOLOGIAS AVANZADAS MX", rfc: "TAM150820QW3", type: "empresa", description: "Desarrollo de software" },
  { id: "5", name: "IMSS", rfc: "IMS431231ABC", type: "dependencia", description: "Instituto Mexicano del Seguro Social" },
  { id: "6", name: "ALMACENAJE Y DISTRIBUCION AVIOR SA DE CV", rfc: "ADV180523XY9", type: "empresa", description: "Almacenamiento y logística" },
  { id: "7", name: "INDAABIN", rfc: "INA000101000", type: "dependencia", description: "Instituto de Administración y Avalúos de Bienes Nacionales" },
  { id: "8", name: "BIRMEX", rfc: "BIR000101000", type: "dependencia", description: "Laboratorios de Biológicos y Reactivos de México" },
  { id: "9", name: "AGROASEMEX SA", rfc: "AGR850601XX1", type: "empresa", description: "Seguros agropecuarios" },
  { id: "10", name: "JET VAN CAR RENTAL SA DE CV", rfc: "JVC190415ZZ2", type: "empresa", description: "Renta de vehículos" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const filtered = DATA.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.rfc.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
  );

  return NextResponse.json({ results: filtered });
}
