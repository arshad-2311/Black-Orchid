import { db } from "./db";
import type { Reservation } from "./types";
import { validateAndNormalizePhone } from "./phone";
import { sendEmailViaResend } from "./providers/resend";
import { sendSmsViaTwilio } from "./providers/twilio";
import {
  renderCustomerReservationEmail,
  renderManagerAlertEmail,
} from "./email-templates";

/**
 * State-Machine Claim Guard for Notifications
 * Enforces database unique constraint, PENDING ownership, stale timeout recovery (>2 mins), and max 3 retries (4 total attempts).
 */
async function claimNotificationAttempt(
  reservationId: string,
  notificationType: "EMAIL_CUSTOMER" | "EMAIL_MANAGER" | "EMAIL" | "SMS",
  recipient: string
): Promise<{ proceed: boolean; logId?: string; status?: string }> {
  try {
    const existing = await db.notificationLog.findUnique({
      where: { reservationId_notificationType: { reservationId, notificationType } },
    });

    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    if (existing) {
      if (existing.status === "SENT") {
        return { proceed: false, status: "SENT" };
      }

      if (existing.status === "PENDING") {
        const lastAttempt = existing.lastAttemptAt || existing.createdAt;
        if (lastAttempt > twoMinutesAgo) {
          // Active process owns the pending attempt
          return { proceed: false, status: "PENDING" };
        }

        // Stale PENDING (> 2 mins ago) — check retry ceiling (max 3 retries)
        if (existing.retryCount >= 3) {
          await db.notificationLog.update({
            where: { id: existing.id },
            data: { status: "FAILED", error: "Max retries reached (Stale recovery cap)" },
          });
          return { proceed: false, status: "FAILED" };
        }

        const updated = await db.notificationLog.update({
          where: { id: existing.id },
          data: {
            status: "PENDING",
            retryCount: { increment: 1 },
            lastAttemptAt: now,
          },
        });
        return { proceed: true, logId: updated.id };
      }

      if (existing.status === "FAILED") {
        if (existing.retryCount >= 3) {
          return { proceed: false, status: "FAILED" };
        }

        const updated = await db.notificationLog.update({
          where: { id: existing.id },
          data: {
            status: "PENDING",
            retryCount: { increment: 1 },
            lastAttemptAt: now,
          },
        });
        return { proceed: true, logId: updated.id };
      }
    }

    // Initial delivery attempt (retryCount = 0)
    try {
      const newLog = await db.notificationLog.create({
        data: {
          reservationId,
          notificationType,
          recipient,
          status: "PENDING",
          retryCount: 0,
          lastAttemptAt: now,
        },
      });
      return { proceed: true, logId: newLog.id };
    } catch (createErr: any) {
      if (createErr?.code === "P2002") {
        // Race condition caught cleanly by unique constraint
        return { proceed: false, status: "PENDING" };
      }
      throw createErr;
    }
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { proceed: false, status: "PENDING" };
    }
    console.error("[Notification Claim Error]", err);
    return { proceed: false, status: "FAILED" };
  }
}

/**
 * Finalizes the notification attempt as SENT or FAILED safely
 */
async function finalizeNotification(
  logId: string,
  success: boolean,
  provider: string,
  error?: string
): Promise<void> {
  try {
    await db.notificationLog.update({
      where: { id: logId },
      data: {
        status: success ? "SENT" : "FAILED",
        provider,
        error: error || null,
      },
    });
  } catch (err) {
    console.error("[Finalize Notification Log Error]", err);
  }
}

/**
 * Send VIP Black & Gold Digital Dining Pass Email to Customer
 */
export async function sendCustomerEmailNotification(
  reservation: Reservation,
  origin: string = "https://black-orchid-lime.vercel.app"
): Promise<"SENT" | "FAILED" | "SKIPPED"> {
  if (!reservation.email || !reservation.email.includes("@")) {
    console.log(`[Customer Email Skipped] Invalid customer email: ${reservation.email}`);
    return "SKIPPED";
  }

  const claim = await claimNotificationAttempt(reservation.id, "EMAIL_CUSTOMER", reservation.email);

  if (!claim.proceed || !claim.logId) {
    return claim.status === "SENT" ? "SENT" : "SKIPPED";
  }

  const logId = claim.logId;
  let success = false;
  let providerUsed = "RESEND";
  let errorMsg: string | undefined = undefined;

  try {
    const { html, text, subject } = renderCustomerReservationEmail(reservation, origin);

    const resendResult = await sendEmailViaResend({
      to: reservation.email,
      subject,
      html,
      text,
    });

    success = resendResult.success;
    errorMsg = resendResult.error;
    if (resendResult.messageId) {
      providerUsed = `RESEND (${resendResult.messageId})`;
    }
  } catch (err: any) {
    success = false;
    errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Customer Email Exception]`, err);
  } finally {
    await finalizeNotification(logId, success, providerUsed, errorMsg);
  }

  return success ? "SENT" : "FAILED";
}

/**
 * Send Executive Email Notification to Restaurant Manager via Resend
 */
export async function sendManagerEmailNotification(
  reservation: Reservation,
  managerEmail: string,
  origin: string = "https://black-orchid-lime.vercel.app"
): Promise<"SENT" | "FAILED" | "SKIPPED"> {
  if (!managerEmail) {
    console.error("[Manager Email Error] No manager recipient email address configured.");
    return "FAILED";
  }

  const claim = await claimNotificationAttempt(reservation.id, "EMAIL_MANAGER", managerEmail);

  if (!claim.proceed || !claim.logId) {
    return claim.status === "SENT" ? "SENT" : "SKIPPED";
  }

  const logId = claim.logId;
  let success = false;
  let providerUsed = "RESEND";
  let errorMsg: string | undefined = undefined;

  try {
    const { html, text, subject } = renderManagerAlertEmail(reservation, origin);

    const resendResult = await sendEmailViaResend({
      to: managerEmail,
      subject,
      html,
      text,
    });

    success = resendResult.success;
    errorMsg = resendResult.error;
    if (resendResult.messageId) {
      providerUsed = `RESEND (${resendResult.messageId})`;
    }
  } catch (err: any) {
    success = false;
    errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Manager Email Exception]`, err);
  } finally {
    await finalizeNotification(logId, success, providerUsed, errorMsg);
  }

  return success ? "SENT" : "FAILED";
}

/**
 * Send Concise Customer SMS Confirmation via Twilio
 */
export async function sendCustomerSmsNotification(
  reservation: Reservation,
  smsSenderName: string
): Promise<"SENT" | "FAILED" | "SKIPPED"> {
  const phoneCheck = validateAndNormalizePhone(reservation.phone);
  if (!phoneCheck.valid) {
    console.log(`[Customer SMS Error] Invalid customer phone format: ${reservation.phone}`);
    return "FAILED";
  }

  const recipient = phoneCheck.normalized;
  const claim = await claimNotificationAttempt(reservation.id, "SMS", recipient);

  if (!claim.proceed || !claim.logId) {
    return claim.status === "SENT" ? "SENT" : "SKIPPED";
  }

  const logId = claim.logId;
  let success = false;
  let providerUsed = "TWILIO";
  let errorMsg: string | undefined = undefined;

  try {
    const smsText = `Black Orchid Anna Nagar\n\nYour reservation has been received.\n\nDate: ${reservation.date}\nTime: ${reservation.time}\nGuests: ${reservation.guests}\n\nReservation ID: ${reservation.id}\n\nWe look forward to welcoming you.`;

    const twilioResult = await sendSmsViaTwilio({
      to: recipient,
      body: smsText,
    });

    success = twilioResult.success;
    errorMsg = twilioResult.error;
    if (twilioResult.sid) {
      providerUsed = `TWILIO (${twilioResult.sid})`;
    }
  } catch (err: any) {
    success = false;
    errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Customer SMS Exception]`, err);
  } finally {
    await finalizeNotification(logId, success, providerUsed, errorMsg);
  }

  return success ? "SENT" : "FAILED";
}

/**
 * Master Dispatcher: Evaluates notifications & triggers Customer Email, Manager Email + Twilio SMS
 */
export async function dispatchReservationNotifications(
  reservation: Reservation,
  origin: string = "https://black-orchid-lime.vercel.app"
): Promise<{
  email: "SENT" | "FAILED" | "DISABLED" | "SKIPPED";
  customerEmail: "SENT" | "FAILED" | "DISABLED" | "SKIPPED";
  sms: "SENT" | "FAILED" | "DISABLED" | "SKIPPED";
}> {
  try {
    const settings = await db.siteSettings.findUnique({ where: { id: "singleton" } });
    const notificationsEnabled = settings?.notificationsEnabled ?? true;

    if (!notificationsEnabled) {
      console.log(`[Notification Engine] Notifications disabled in Admin Settings.`);
      return { email: "DISABLED", customerEmail: "DISABLED", sms: "DISABLED" };
    }

    // Manager Email resolution priority: 1. managerEmail, 2. email, 3. process.env.MANAGER_EMAIL
    const managerEmail = settings?.managerEmail || settings?.email || process.env.MANAGER_EMAIL || "";
    const smsSenderName = settings?.smsSenderName || "Black Orchid Anna Nagar";

    const [managerEmailRes, customerEmailRes, smsRes] = await Promise.allSettled([
      sendManagerEmailNotification(reservation, managerEmail, origin),
      sendCustomerEmailNotification(reservation, origin),
      sendCustomerSmsNotification(reservation, smsSenderName),
    ]);

    const emailStatus = managerEmailRes.status === "fulfilled" ? managerEmailRes.value : "FAILED";
    const customerEmailStatus = customerEmailRes.status === "fulfilled" ? customerEmailRes.value : "FAILED";
    const smsStatus = smsRes.status === "fulfilled" ? smsRes.value : "FAILED";

    return { email: emailStatus, customerEmail: customerEmailStatus, sms: smsStatus };
  } catch (err) {
    console.error("[Notification Engine Fatal Error]", err);
    return { email: "FAILED", customerEmail: "FAILED", sms: "FAILED" };
  }
}
