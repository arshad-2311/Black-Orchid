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
  const data: Record<string, unknown> = { ...body };
  if (data.rating !== undefined) data.rating = Number(data.rating);
  const t = await db.testimonial.update({ where: { id }, data });

  try {
    revalidatePath("/api/testimonials");
    revalidatePath("/");
  } catch {}

  return NextResponse.json(t);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.testimonial.delete({ where: { id } });

  try {
    revalidatePath("/api/testimonials");
    revalidatePath("/");
  } catch {}

  return NextResponse.json({ ok: true, deletedId: id });
}
