import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  if (!id) return NextResponse.json({ success: false, error: "Missing reservation ID" }, { status: 400 });

  try {
    const body = await req.json();
    const data: Record<string, unknown> = { ...body };
    if (data.guests !== undefined) data.guests = Number(data.guests);
    if (data.kids !== undefined) data.kids = Number(data.kids);

    const updated = await db.reservation.update({ where: { id }, data });
    
    try {
      revalidatePath("/api/reservations");
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update reservation:", err);
    return NextResponse.json({ success: false, error: "Failed to update reservation" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  if (!id) return NextResponse.json({ success: false, error: "Missing reservation ID" }, { status: 400 });

  try {
    // Delete any associated notification logs first
    await db.notificationLog.deleteMany({ where: { reservationId: id } }).catch(() => {});
    await db.reservation.delete({ where: { id } });

    try {
      revalidatePath("/api/reservations");
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("Failed to delete reservation:", err);
    return NextResponse.json({ success: false, error: "Failed to delete reservation" }, { status: 500 });
  }
}
