import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { validateAndNormalizePhone } from "@/lib/phone";
import { dispatchReservationNotifications } from "@/lib/notifications";

// Zod validation schema for table reservations
const reservationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20, "Phone number too long"),
  email: z.string().trim().email("Please enter a valid email address"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").refine((d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resDate = new Date(`${d}T00:00:00`);
    return !isNaN(resDate.getTime()) && resDate >= today;
  }, "Reservation date cannot be in the past"),
  time: z.string().trim().min(1, "Time slot is required"),
  guests: z.coerce.number().int("Guest count must be a whole number").min(1, "At least 1 guest required").max(20, "Maximum 20 guests per online booking"),
  kids: z.coerce.number().int("Kids count must be a whole number").min(0).max(10).optional().default(0),
  special: z.string().trim().max(500, "Special request text must not exceed 500 characters").optional().nullable(),
});

// In-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(req: Request): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true; // Rate limited
  }
  
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// Public: create a reservation
export async function POST(req: Request) {
  try {
    // 1. Rate limiting check
    if (checkRateLimit(req)) {
      return NextResponse.json(
        { error: "Too many reservation requests. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse request body
    const body = await req.json().catch(() => ({}));

    // 3. Validate with Zod schema
    const result = reservationSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid reservation details";
      return NextResponse.json({ error: firstError, details: result.error.format() }, { status: 400 });
    }

    const { name, phone, email, date, time, guests, kids, special } = result.data;
    const phoneCheck = validateAndNormalizePhone(phone);

    // 4. Persist reservation to database
    const reservation = await db.reservation.create({
      data: {
        name,
        phone,
        phoneNormalized: phoneCheck.normalized || phone,
        email,
        date,
        time,
        guests,
        kids: kids || 0,
        special: special || null,
        status: "CONFIRMED",
      },
    });

    // 5. Reliable Server-side Notification Dispatch (isolated from DB result)
    let notificationStatus = { email: "SKIPPED", sms: "SKIPPED" };
    try {
      const origin = req.headers.get("origin") || req.headers.get("referer") || "";
      notificationStatus = await dispatchReservationNotifications(
        reservation as unknown as import("@/lib/types").Reservation,
        origin
      );
    } catch (notifErr) {
      console.error("[Reservation API] Notification dispatch error (DB record preserved):", notifErr);
    }

    return NextResponse.json(
      {
        ...reservation,
        notificationStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reservation creation error:", error);
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
