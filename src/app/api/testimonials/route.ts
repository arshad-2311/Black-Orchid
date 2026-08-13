import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public: featured testimonials
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const featuredOnly = searchParams.get("featured") === "1";
  const items = await db.testimonial.findMany({
    where: featuredOnly ? { featured: true } : {},
    orderBy: { order: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const t = await db.testimonial.create({
    data: {
      name: body.name,
      role: body.role || null,
      photo: body.photo || null,
      rating: Number(body.rating) || 5,
      message: body.message,
      featured: body.featured ?? false,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(t);
}
