import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Public: create a reservation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, date, time, guests, special } = body;
    if (!name || !phone || !email || !date || !time || !guests) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }
    const reservation = await db.reservation.create({
      data: {
        name,
        phone,
        email,
        date,
        time,
        guests: Number(guests),
        special: special || null,
        status: "PENDING",
      },
    });
    return NextResponse.json(reservation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
}

// Admin: list reservations
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status && status !== "ALL" ? { status } : {};
  const reservations = await db.reservation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reservations);
}
