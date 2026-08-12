import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed-inline";

export async function GET() {
  await ensureSeeded();
  const images = await db.galleryImage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(images);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const img = await db.galleryImage.create({
    data: {
      title: body.title || "Untitled",
      url: body.url,
      caption: body.caption || null,
      category: body.category || "Interior",
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(img);
}
