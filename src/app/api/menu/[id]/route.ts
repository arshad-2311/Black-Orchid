import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  // Build a clean update payload, serializing array fields to JSON strings
  const data: Record<string, unknown> = {};
  const allowed = [
    "name","tagline","description","shortDescription","price","image","categoryId",
    "available","veg","spice","featured","chefRecommended","servingSize","order",
  ];
  for (const k of allowed) if (k in body) data[k] = body[k];
  if (data.price !== undefined) data.price = Number(data.price);
  if (data.spice !== undefined) data.spice = Number(data.spice);
  if ("images" in body) {
    const imgs: string[] = Array.isArray(body.images) ? body.images : [];
    data.images = JSON.stringify(imgs);
    data.image = imgs[0] ?? data.image ?? null;
  }
  if ("ingredients" in body) data.ingredients = JSON.stringify(Array.isArray(body.ingredients) ? body.ingredients : []);
  if ("allergens" in body) data.allergens = JSON.stringify(Array.isArray(body.allergens) ? body.allergens : []);

  const item = await db.menuItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
