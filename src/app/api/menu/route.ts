import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { MenuItem } from "@/lib/types";

// Parse the raw Prisma menu item (with JSON string fields) into the client type
function parseItem(raw: any): MenuItem {
  let images: string[] = [];
  let ingredients: string[] = [];
  let allergens: string[] = [];
  try { images = raw.images ? JSON.parse(raw.images) : []; } catch {}
  try { ingredients = raw.ingredients ? JSON.parse(raw.ingredients) : []; } catch {}
  try { allergens = raw.allergens ? JSON.parse(raw.allergens) : []; } catch {}
  // Ensure images is non-empty + includes the legacy `image` field as first entry
  if (raw.image && !images.includes(raw.image)) images = [raw.image, ...images];
  return {
    id: raw.id,
    name: raw.name,
    tagline: raw.tagline ?? null,
    description: raw.description,
    shortDescription: raw.shortDescription ?? null,
    price: raw.price,
    image: raw.image ?? null,
    images,
    categoryId: raw.categoryId,
    available: raw.available,
    veg: raw.veg,
    spice: raw.spice,
    featured: raw.featured,
    chefRecommended: raw.chefRecommended ?? false,
    ingredients,
    allergens,
    servingSize: raw.servingSize ?? null,
    order: raw.order,
  };
}

// Public: list categories with items (parsed)
export async function GET() {
  const categories = await db.menuCategory.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  const parsed = categories.map((c) => ({ ...c, items: c.items.map(parseItem) }));
  return NextResponse.json(parsed);
}

// Admin: create category OR menu item
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body._type === "category") {
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-");
    const cat = await db.menuCategory.create({
      data: { name: body.name, slug, order: body.order ?? 0 },
    });
    return NextResponse.json(cat);
  }
  // create menu item
  const images: string[] = Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []);
  const created = await db.menuItem.create({
    data: {
      name: body.name,
      tagline: body.tagline || null,
      description: body.description || "",
      shortDescription: body.shortDescription || null,
      price: Number(body.price),
      image: body.image || images[0] || null,
      images: JSON.stringify(images),
      category: { connect: { id: body.categoryId } },
      available: body.available ?? true,
      veg: body.veg ?? false,
      spice: Number.isFinite(Number(body.spice)) ? Number(body.spice) : 0,
      featured: body.featured ?? false,
      chefRecommended: body.chefRecommended ?? false,
      ingredients: JSON.stringify(Array.isArray(body.ingredients) ? body.ingredients : []),
      allergens: JSON.stringify(Array.isArray(body.allergens) ? body.allergens : []),
      servingSize: body.servingSize || null,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(parseItem(created));
}
