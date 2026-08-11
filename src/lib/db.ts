import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Enable SQLite Write-Ahead Logging (WAL) & busy timeout for concurrent read/write support
if (typeof window === "undefined") {
  db.$queryRawUnsafe("PRAGMA journal_mode=WAL;")
    .then(() => db.$queryRawUnsafe("PRAGMA busy_timeout=5000;"))
    .catch(() => {
      /* noop */
    });
}