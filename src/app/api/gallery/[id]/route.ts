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
  const img = await db.galleryImage.update({ where: { id }, data: body });

  try {
    revalidatePath("/api/gallery");
    revalidatePath("/");
  } catch {}

  return NextResponse.json(img);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.galleryImage.delete({ where: { id } });

  try {
    revalidatePath("/api/gallery");
    revalidatePath("/");
  } catch {}

  return NextResponse.json({ ok: true, deletedId: id });
}
