import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";

// Real file upload endpoint — saves to public/uploads/ and returns the URL.
// Stores ONLY the URL path in the database (never Base64).
export async function POST(req: Request) {
  // Require admin auth
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const allowed = /image\/(jpeg|jpg|png|webp|gif|avif)/;
    if (!allowed.test(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP, GIF, AVIF allowed" }, { status: 400 });
    }
    // Validate size (6MB max)
    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 6MB" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Ensure uploads dir exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate a unique filename: <timestamp>-<random>.<ext>
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
    const safeExt = /jpg|jpeg|png|webp|gif|avif/.test(ext) ? ext : "jpg";
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt}`;
    const filePath = path.join(uploadDir, name);

    // Write the file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Return the URL path (served from public/uploads/)
    const url = `/uploads/${name}`;
    return NextResponse.json({ url, name, size: file.size });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
