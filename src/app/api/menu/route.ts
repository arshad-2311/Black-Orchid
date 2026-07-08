import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Public: list categories with items
export async function GET() {
  const categories = await db.menuCategory.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(categories);
}

// Admin: create category
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
  const item = await db.menuItem.create({
    data: {
      name: body.name,
      description: body.description || "",
      price: Number(body.price),
      image: body.image || null,
      categoryId: body.categoryId,
      available: body.available ?? true,
      veg: body.veg ?? false,
      spice: body.spice ?? 0,
      featured: body.featured ?? false,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(item);
}
