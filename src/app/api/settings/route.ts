import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed-inline";

export async function GET() {
  await ensureSeeded();
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
    "phone","phoneSecondary","email","managerEmail","smsSenderName","notificationsEnabled",
    "address","mapEmbed","hoursWeekday","hoursWeekend",
    "instagram","facebook","twitter","whatsapp","banquetCapacity","banquetDesc",
    "metaTitle","metaDesc",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  // The singleton row is created during seeding. Use update (not upsert) to
  // avoid Prisma validating a full `create` with all required fields.
  // If the row somehow doesn't exist, create it with sensible defaults first.
  const existing = await db.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!existing) {
    await db.siteSettings.create({ data: { id: "singleton", ...data } as any });
  } else {
    await db.siteSettings.update({ where: { id: "singleton" }, data });
  }
  const updated = await db.siteSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(updated);
}
