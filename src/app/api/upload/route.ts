import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Allowed image MIME types
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
]);

// Maximum file size: 25 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    // 1. Authenticate admin
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access: Please log in to admin panel again." }, { status: 401 });
    }

    // 2. Extract multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // 3. Validate file size & type
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 25 MB limit" },
        { status: 400 }
      );
    }

    if (file.type && !ALLOWED_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported image format: ${file.type}. Allowed formats: JPG, PNG, WebP, GIF, AVIF, HEIC, BMP, TIFF` },
        { status: 400 }
      );
    }

    // 4. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 5. Process image with Sharp: auto-rotate, resize to max 1200px, compress to WebP
    const processedBuffer = await sharp(inputBuffer)
      .rotate() // Respect EXIF orientation
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 6. Ensure public/uploads directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // 7. Save file with unique filename
    const filename = `${randomUUID()}.webp`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filePath, processedBuffer);

    // 8. Return relative URL path
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to process and save uploaded image" },
      { status: 500 }
    );
  }
}
