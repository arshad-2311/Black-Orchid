// Enable LIVE notification mode for testing real API endpoints
process.env.NOTIFICATION_TEST_MODE = "live";

import { db } from "../src/lib/db";
import { dispatchReservationNotifications } from "../src/lib/notifications";

async function runLiveTest() {
  console.log("=== BLACK ORCHID LIVE RESEND TEST (To Account Email) ===");

  const testId = `live-res-${Date.now()}`;
  const testReservation = await db.reservation.create({
    data: {
      id: testId,
      name: "Arshad Live Test",
      phone: "+918667760793",
      phoneNormalized: "+918667760793",
      email: "arshadasik.7@gmail.com",
      date: "2026-08-16",
      time: "8:00 PM",
      guests: 2,
      kids: 0,
      special: "Live reservation notification test",
      status: "CONFIRMED",
    },
  });

  // Temporarily set SiteSettings.managerEmail to arshadasik.7@gmail.com
  await db.siteSettings.update({
    where: { id: "singleton" },
    data: { managerEmail: "arshadasik.7@gmail.com" },
  });

  console.log(`[Live Test] Reservation created in DB: ${testReservation.id}`);
  console.log("[Live Test] Triggering live Resend dispatch to arshadasik.7@gmail.com...");

  const result = await dispatchReservationNotifications(testReservation as any);
  console.log("\n[Live Test Result]:", result);

  const logs = await db.notificationLog.findMany({
    where: { reservationId: testId },
  });

  console.log("\n[DB NotificationLog Records]:");
  console.table(
    logs.map((l) => ({
      type: l.notificationType,
      status: l.status,
      provider: l.provider,
      recipient: l.recipient,
      error: l.error || "None",
    }))
  );

  // Clean up test reservation
  await db.notificationLog.deleteMany({ where: { reservationId: testId } });
  await db.reservation.delete({ where: { id: testId } });

  console.log("\n=== LIVE TEST COMPLETE ===");
}

runLiveTest().catch(console.error);
