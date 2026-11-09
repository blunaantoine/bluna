import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPaymentMethods } from "@/lib/payment-methods";
import { methodInput } from "./validate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ methods: await getPaymentMethods({ all: true }) });
}

export async function POST(req: Request) {
  const parsed = methodInput(await req.json().catch(() => ({})), true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  const max = await db.paymentMethod.aggregate({ _max: { order: true } });
  const method = await db.paymentMethod.create({ data: { kind: "mobile", label: "", value: "", ...parsed.data, order: (max._max.order ?? 0) + 1 } as never });
  revalidatePath("/", "layout");
  return NextResponse.json({ method });
}
