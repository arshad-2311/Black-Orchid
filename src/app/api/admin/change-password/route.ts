import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, verifyPassword, hashPassword } from "@/lib/auth";

// POST /api/admin/change-password
// Protected: requires a valid admin JWT. Validates the current password,
// then hashes the new password with bcrypt and persists it.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "New password must be different from the current password" }, { status: 400 });
    }

    // Fetch the admin user (by token subject) to verify the current password
    const user = await db.adminUser.findUnique({ where: { id: admin.sub } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the current password is correct
    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    // Hash the new password with bcrypt and persist
    const hashed = await hashPassword(newPassword);
    await db.adminUser.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Password change failed" }, { status: 500 });
  }
}
