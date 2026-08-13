import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed-inline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(req);
  const events = await db.eventItem.findMany({
    where: admin ? {} : { published: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title || !body.date) {
      return NextResponse.json({ success: false, error: "Title and date are required" }, { status: 400 });
    }

    const created = await db.eventItem.create({
      data: {
        title: String(body.title).trim(),
        description: body.description ? String(body.description).trim() : "",
        date: String(body.date).trim(),
        image: body.image ? String(body.image).trim() : null,
        published: body.published !== undefined ? Boolean(body.published) : true,
      },
    });

    try {
      revalidatePath("/api/events");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true, event: created }, { status: 201 });
  } catch (err) {
    console.error("Failed to create event:", err);
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 });
  }
}
