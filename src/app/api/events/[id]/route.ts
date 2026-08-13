import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
  }

  const existing = await db.eventItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updated = await db.eventItem.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        date: body.date !== undefined ? body.date : existing.date,
        image: body.image !== undefined ? body.image : existing.image,
        published: body.published !== undefined ? Boolean(body.published) : existing.published,
      },
    });

    try {
      revalidatePath("/api/events");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true, event: updated });
  } catch (err) {
    console.error("Failed to update event:", err);
    return NextResponse.json({ success: false, error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
  }

  const existing = await db.eventItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
  }

  try {
    // 1. Delete database record
    await db.eventItem.delete({ where: { id } });

    // 2. Post-delete verification in database
    const verifyCheck = await db.eventItem.findUnique({ where: { id } });
    if (verifyCheck) {
      throw new Error("Database deletion did not persist");
    }

    // 3. Revalidate Next.js cache
    try {
      revalidatePath("/api/events");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("Failed to delete event:", err);
    return NextResponse.json({ success: false, error: "Failed to delete event from database" }, { status: 500 });
  }
}
