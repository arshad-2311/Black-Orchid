import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed-inline";

export async function GET() {
  await ensureSeeded();
  const packages = await db.cateringPackage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(packages);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const p = await db.cateringPackage.create({
    data: {
      name: body.name,
      description: body.description || "",
      price: Number(body.price),
      image: body.image || null,
      guests: body.guests || "",
      features: body.features || "",
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(p);
}
