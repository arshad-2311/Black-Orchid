import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const settings = await db.siteSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  // Only allow known fields
  const allowed: string[] = [
    "restaurantName","tagline","heroTitle","heroSubtitle","aboutTitle","aboutBody",
    "phone","email","address","mapEmbed","hoursWeekday","hoursWeekend",
    "instagram","facebook","twitter","whatsapp","banquetCapacity","banquetDesc",
    "metaTitle","metaDesc",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  const updated = await db.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  return NextResponse.json(updated);
}
