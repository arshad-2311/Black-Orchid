import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const events = await db.eventItem.findMany({
    where: { published: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const e = await db.eventItem.create({
    data: {
      title: body.title,
      description: body.description || "",
      date: body.date,
      image: body.image || null,
      published: body.published ?? true,
    },
  });
  return NextResponse.json(e);
}
