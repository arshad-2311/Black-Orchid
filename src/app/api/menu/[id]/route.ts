import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  // Build a clean update payload, serializing array fields to JSON strings
  const data: Record<string, unknown> = {};
  const allowed = [
    "name","tagline","description","shortDescription","price","image","categoryId",
    "available","veg","dietaryType","spice","featured","chefRecommended","servingSize","winePairing",
    "tastingNotes","pairingPrice","order",
  ];
  for (const k of allowed) if (k in body) data[k] = body[k];
  if ("price" in body) data.price = body.price !== null && body.price !== undefined ? Number(body.price) : 0;
  if (data.pairingPrice !== undefined) {
    const pp = Number(data.pairingPrice);
    data.pairingPrice = Number.isFinite(pp) && pp > 0 ? pp : null;
  }
  if (data.spice !== undefined) {
    const s = Number(data.spice);
    data.spice = Number.isFinite(s) ? s : 0;
  }
  if ("variants" in body) {
    const vars: any[] = Array.isArray(body.variants) ? body.variants : [];
    data.variants = JSON.stringify(vars);
  }
  if ("images" in body) {
    const imgs: string[] = Array.isArray(body.images) ? body.images : [];
    data.images = JSON.stringify(imgs);
    data.image = imgs[0] ?? data.image ?? null;
  }
  if ("ingredients" in body) data.ingredients = JSON.stringify(Array.isArray(body.ingredients) ? body.ingredients : []);
  if ("allergens" in body) data.allergens = JSON.stringify(Array.isArray(body.allergens) ? body.allergens : []);

  const item = await db.menuItem.update({ where: { id }, data });

  try {
    revalidatePath("/api/menu");
    revalidatePath("/menu");
    revalidatePath("/");
  } catch {}

  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.menuItem.delete({ where: { id } });

  try {
    revalidatePath("/api/menu");
    revalidatePath("/menu");
    revalidatePath("/");
  } catch {}

  return NextResponse.json({ ok: true, deletedId: id });
}
