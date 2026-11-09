import BillingAdmin from "@/components/admin/BillingAdmin";
import { getProjects } from "@/lib/projects";
import { fedapayEnabled } from "@/lib/fedapay";

export const dynamic = "force-dynamic";
export default async function AdminInvoices() {
  const projects = (await getProjects({ all: true })).map((p) => ({ slug: p.slug, title: p.title }));
  return <BillingAdmin projects={projects} online={fedapayEnabled()} />;
}
