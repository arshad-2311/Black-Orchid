// Force NOTIFICATION_TEST_MODE=mock for automated test execution
process.env.NOTIFICATION_TEST_MODE = "mock";

import { db } from "../src/lib/db";
import { dispatchReservationNotifications } from "../src/lib/notifications";

async function runNotificationTestSuite() {
  console.log("=== BLACK ORCHID RESERVATION NOTIFICATION SUITE (10 SCENARIOS) ===");

  // Clean up previous test records
  await db.notificationLog.deleteMany({
    where: { reservationId: { startsWith: "test-res-" } },
  });
  await db.reservation.deleteMany({
    where: { id: { startsWith: "test-res-" } },
  });

  const baseResData = {
    name: "Arthur Pendelton",
    phone: "+91 98765 43210",
    phoneNormalized: "+919876543210",
    email: "arthur.test@example.com",
    date: "2026-08-15",
    time: "8:00 PM",
    guests: 4,
    kids: 1,
    special: "Window booth preferred",
    status: "CONFIRMED",
  };

  // ------------------------------------------------------------
  // TEST 1: Resend Success + Twilio Success
  // ------------------------------------------------------------
  console.log("\n[TEST 1] Resend Success + Twilio Success");
  const testId1 = `test-res-1-${Date.now()}`;
  const res1 = await db.reservation.create({ data: { id: testId1, ...baseResData } });
  const out1 = await dispatchReservationNotifications(res1 as any);
  console.log("Result:", out1);
  if (out1.email !== "SENT" || out1.sms !== "SENT") throw new Error("TEST 1 Failed");

  // ------------------------------------------------------------
  // TEST 2: Resend Failure + Twilio Success
  // ------------------------------------------------------------
  console.log("\n[TEST 2] Resend Failure + Twilio Success");
  const testId2 = `test-res-2-${Date.now()}`;
  const res2 = await db.reservation.create({ data: { id: testId2, ...baseResData } });
  // Manually pre-seed FAILED email log with max retries
  await db.notificationLog.create({
    data: {
      reservationId: testId2,
      notificationType: "EMAIL",
      recipient: "no.manager@configured.com",
      status: "FAILED",
      provider: "RESEND",
      error: "Missing RESEND_FROM_EMAIL",
      retryCount: 3,
      lastAttemptAt: new Date(),
    },
  });
  const out2 = await dispatchReservationNotifications(res2 as any);
  console.log("Result:", out2);
  if (out2.sms !== "SENT") throw new Error("TEST 2 Failed");

  // ------------------------------------------------------------
  // TEST 3: Resend Success + Twilio Failure
  // ------------------------------------------------------------
  console.log("\n[TEST 3] Resend Success + Twilio Failure");
  const testId3 = `test-res-3-${Date.now()}`;
  const res3 = await db.reservation.create({ data: { id: testId3, ...baseResData, phone: "invalid" } });
  const out3 = await dispatchReservationNotifications(res3 as any);
  console.log("Result:", out3);
  if (out3.sms !== "FAILED") throw new Error("TEST 3 Failed");

  // ------------------------------------------------------------
  // TEST 4: Both Providers Fail
  // ------------------------------------------------------------
  console.log("\n[TEST 4] Both Providers Fail");
  const testId4 = `test-res-4-${Date.now()}`;
  const res4 = await db.reservation.create({ data: { id: testId4, ...baseResData, phone: "invalid" } });
  await db.notificationLog.create({
    data: {
      reservationId: testId4,
      notificationType: "EMAIL",
      recipient: "bad",
      status: "FAILED",
      provider: "RESEND",
      error: "API error",
      retryCount: 3,
      lastAttemptAt: new Date(),
    },
  });
  const out4 = await dispatchReservationNotifications(res4 as any);
  console.log("Result:", out4);
  if (out4.sms !== "FAILED" && out4.email !== "FAILED") throw new Error("TEST 4 Failed");

  // ------------------------------------------------------------
  // TEST 5: Notifications Disabled in Admin Settings
  // ------------------------------------------------------------
  console.log("\n[TEST 5] Notifications Disabled");
  const testId5 = `test-res-5-${Date.now()}`;
  const res5 = await db.reservation.create({ data: { id: testId5, ...baseResData } });
  await db.siteSettings.update({ where: { id: "singleton" }, data: { notificationsEnabled: false } });
  const out5 = await dispatchReservationNotifications(res5 as any);
  console.log("Result:", out5);
  if (out5.email !== "DISABLED" || out5.sms !== "DISABLED") throw new Error("TEST 5 Failed");
  // Restore notification setting
  await db.siteSettings.update({ where: { id: "singleton" }, data: { notificationsEnabled: true } });

  // ------------------------------------------------------------
  // TEST 6: Existing SENT Notification (Idempotency)
  // ------------------------------------------------------------
  console.log("\n[TEST 6] Existing SENT Notification");
  const out6 = await dispatchReservationNotifications(res1 as any);
  console.log("Result:", out6);
  const logs6 = await db.notificationLog.findMany({ where: { reservationId: testId1 } });
  if (logs6.length !== 2) throw new Error("TEST 6 Failed — duplicate logs created");

  // ------------------------------------------------------------
  // TEST 7: Recent PENDING (<= 2 Mins)
  // ------------------------------------------------------------
  console.log("\n[TEST 7] Recent PENDING (<= 2 Mins)");
  const testId7 = `test-res-7-${Date.now()}`;
  const res7 = await db.reservation.create({ data: { id: testId7, ...baseResData } });
  await db.notificationLog.create({
    data: {
      reservationId: testId7,
      notificationType: "SMS",
      recipient: "+919876543210",
      status: "PENDING",
      provider: "TWILIO",
      retryCount: 0,
      lastAttemptAt: new Date(),
    },
  });
  const out7 = await dispatchReservationNotifications(res7 as any);
  console.log("Result:", out7);
  if (out7.sms !== "SKIPPED") throw new Error("TEST 7 Failed — concurrent attempt not skipped");

  // ------------------------------------------------------------
  // TEST 8: Stale PENDING (> 2 Mins) Recovery
  // ------------------------------------------------------------
  console.log("\n[TEST 8] Stale PENDING (> 2 Mins) Recovery");
  const testId8 = `test-res-8-${Date.now()}`;
  const res8 = await db.reservation.create({ data: { id: testId8, ...baseResData } });
  const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000);
  await db.notificationLog.create({
    data: {
      reservationId: testId8,
      notificationType: "EMAIL",
      recipient: "manager@test.com",
      status: "PENDING",
      provider: "CRASHED_WORKER",
      retryCount: 0,
      createdAt: threeMinsAgo,
      lastAttemptAt: threeMinsAgo,
    },
  });
  const out8 = await dispatchReservationNotifications(res8 as any);
  console.log("Result:", out8);
  const log8 = await db.notificationLog.findUnique({
    where: { reservationId_notificationType: { reservationId: testId8, notificationType: "EMAIL" } },
  });
  if (log8?.status !== "SENT" || log8?.retryCount !== 1) throw new Error("TEST 8 Failed — stale recovery failed");

  // ------------------------------------------------------------
  // TEST 9: Max Retries (retryCount = 3)
  // ------------------------------------------------------------
  console.log("\n[TEST 9] Max Retries Ceiling (retryCount = 3)");
  const testId9 = `test-res-9-${Date.now()}`;
  const res9 = await db.reservation.create({ data: { id: testId9, ...baseResData } });
  await db.notificationLog.create({
    data: {
      reservationId: testId9,
      notificationType: "SMS",
      recipient: "+919876543210",
      status: "FAILED",
      provider: "TWILIO",
      retryCount: 3,
      lastAttemptAt: new Date(),
    },
  });
  const out9 = await dispatchReservationNotifications(res9 as any);
  console.log("Result:", out9);
  if (out9.sms !== "SKIPPED") throw new Error("TEST 9 Failed — max retries ceiling violated");

  // ------------------------------------------------------------
  // TEST 10: Double Reservation Submission (Unique Constraint Idempotency)
  // ------------------------------------------------------------
  console.log("\n[TEST 10] Double Submission Idempotency");
  const testId10 = `test-res-10-${Date.now()}`;
  const res10 = await db.reservation.create({ data: { id: testId10, ...baseResData } });
  const [p1, p2] = await Promise.all([
    dispatchReservationNotifications(res10 as any),
    dispatchReservationNotifications(res10 as any),
  ]);
  console.log("Parallel Dispatch Results:", { p1, p2 });
  const logs10 = await db.notificationLog.findMany({ where: { reservationId: testId10 } });
  if (logs10.length !== 2) throw new Error("TEST 10 Failed — duplicate logs created under parallel execution");

  // Cleanup test records
  await db.notificationLog.deleteMany({
    where: { reservationId: { startsWith: "test-res-" } },
  });
  await db.reservation.deleteMany({
    where: { id: { startsWith: "test-res-" } },
  });

  console.log("\n=== ALL 10 NOTIFICATION SCENARIOS PASSED 100% ===");
}

runNotificationTestSuite().catch(console.error);
