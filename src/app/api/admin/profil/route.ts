import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cleanProfile, defaultProfile, getProfile, saveProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ profile: await getProfile(), defaults: defaultProfile });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const profile = cleanProfile(body);
  await saveProfile(profile);
  revalidatePath("/"); revalidatePath("/a-propos");
  return NextResponse.json({ profile });
}
