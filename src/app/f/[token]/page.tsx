import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fcfa, remaining } from "@/lib/invoices";
import { profile } from "@/content/site";
import Envelope from "@/components/billing/Envelope";
import "../envelope.css";

const isans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-isans", display: "swap" });
const iserif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-iserif", display: "swap" });

export const dynamic = "force-dynamic";

// Aperçu du lien (WhatsApp, iMessage, e-mail) : l'enveloppe, sans aucune donnée du client.
export const metadata: Metadata = {
  title: { absolute: `Vous avez reçu une facture — ${profile.studio}` },
  description: "Un document vous attend. Brisez le sceau pour l'ouvrir.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: profile.studio,
    title: `Vous avez reçu une facture — ${profile.studio}`,
    description: "Un document vous attend. Brisez le sceau pour l'ouvrir.",
    images: [{ url: "/og/enveloppe.jpg", width: 1200, height: 630, alt: "Une enveloppe noire fermée par un sceau de cire doré" }],
  },
  twitter: { card: "summary_large_image", images: ["/og/enveloppe.jpg"] },
  other: { "theme-color": "#050505" },
};

const dateFr = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Lien court envoyé au client : l'enveloppe s'ouvre, puis mène à la facture. */
export default async function EnvelopePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true } });
  if (!inv || inv.status === "brouillon") notFound();
  const paid = inv.status === "payee";
  const due = remaining(inv);
  return (
    <div className={`${isans.variable} ${iserif.variable}`}>
      <Envelope
        brand={profile.studio}
        client={inv.client.name}
        reference={inv.number}
        due={paid || !inv.dueAt ? "" : dateFr(inv.dueAt)}
        amount={fcfa(paid ? inv.total : due)}
        to={`/facture/${inv.token}${paid || inv.status === "annulee" ? "" : "?payer=1"}`}
        paid={paid}
        discount={inv.discount > 0 ? `− ${fcfa(inv.discount)}` : ""}
      />
    </div>
  );
}
