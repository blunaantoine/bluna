import { NextResponse } from "next/server";
import { buildReport, reportCsv } from "@/lib/reports";

export const dynamic = "force-dynamic";

/** Rapport mensuel (?annee=2026&mois=11) ou annuel (?annee=2026). Ajoutez &format=csv pour le tableur. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const year = Number(u.searchParams.get("annee")) || new Date().getFullYear();
  const m = Number(u.searchParams.get("mois"));
  const month = m >= 1 && m <= 12 ? m : null;
  const report = await buildReport({ year, month });
  if (u.searchParams.get("format") === "csv") {
    const name = `rapport-oqui-${year}${month ? `-${String(month).padStart(2, "0")}` : ""}.csv`;
    return new Response(reportCsv(report), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` } });
  }
  return NextResponse.json(report);
}
