import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("custom.db")) {
    return process.env.DATABASE_URL;
  }

  // On Vercel / AWS Lambda serverless functions, the root deployment directory is read-only (/var/task).
  // We must store SQLite in the writable /tmp directory.
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (isVercel) {
    const tmpDbPath = "/tmp/custom.db";
    const srcDbPath = path.join(process.cwd(), "db", "custom.db");

    try {
      if (!fs.existsSync(tmpDbPath)) {
        const tmpDir = path.dirname(tmpDbPath);
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        if (fs.existsSync(srcDbPath)) {
          fs.copyFileSync(srcDbPath, tmpDbPath);
          console.log("✓ Copied bundled database to /tmp/custom.db");
        }
      }
    } catch (e) {
      console.error("Vercel /tmp database preparation warning:", e);
    }
    return "file:/tmp/custom.db";
  }

  return process.env.DATABASE_URL || "file:./db/custom.db";
}

const activeUrl = getDatabaseUrl();
process.env.DATABASE_URL = activeUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Enable SQLite Write-Ahead Logging (WAL) & busy timeout for concurrent read/write support
if (typeof window === "undefined") {
  db.$queryRawUnsafe("PRAGMA journal_mode=WAL;")
    .then(() => db.$queryRawUnsafe("PRAGMA busy_timeout=5000;"))
    .catch(() => {
      /* noop */
    });
}