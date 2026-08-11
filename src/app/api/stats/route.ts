import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const [
    totalReservations,
    todayReservations,
    pendingReservations,
    totalMenuItems,
    totalGallery,
    totalEvents,
    totalTestimonials,
    totalPackages,
  ] = await Promise.all([
    db.reservation.count(),
    db.reservation.count({ where: { date: today } }),
    db.reservation.count({ where: { status: "PENDING" } }),
    db.menuItem.count(),
    db.galleryImage.count(),
    db.eventItem.count(),
    db.testimonial.count(),
    db.cateringPackage.count(),
  ]);

  const recentReservations = await db.reservation.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  // Build last-7-days reservation counts
  const days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = await db.reservation.count({ where: { date: key } });
    days.push({ date: key, count });
  }

  return NextResponse.json({
    totalReservations,
    todayReservations,
    pendingReservations,
    totalMenuItems,
    totalGallery,
    totalEvents,
    totalTestimonials,
    totalPackages,
    visitors: 12840, // placeholder
    recentReservations,
    weekly: days,
  });
}
