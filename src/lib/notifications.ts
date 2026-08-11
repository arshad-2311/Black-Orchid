import { db } from "./db";
import type { Reservation } from "./types";
import { validateAndNormalizePhone } from "./phone";
import { sendEmailViaResend } from "./providers/resend";
import { sendSmsViaTwilio } from "./providers/twilio";

/**
 * State-Machine Claim Guard for Notifications
 * Enforces database unique constraint, PENDING ownership, stale timeout recovery (>2 mins), and max 3 retries (4 total attempts).
 */
async function claimNotificationAttempt(
  reservationId: string,
  notificationType: "EMAIL" | "SMS",
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
 * Send Email Notification to Restaurant Manager via Resend
 */
export async function sendManagerEmailNotification(
  reservation: Reservation,
  managerEmail: string,
  origin: string = ""
): Promise<"SENT" | "FAILED" | "SKIPPED"> {
  if (!managerEmail) {
    console.error("[Manager Email Error] No manager recipient email address configured.");
    return "FAILED";
  }

  const claim = await claimNotificationAttempt(reservation.id, "EMAIL", managerEmail);

  if (!claim.proceed || !claim.logId) {
    return claim.status === "SENT" ? "SENT" : "SKIPPED";
  }

  const logId = claim.logId;
  let success = false;
  let providerUsed = "RESEND";
  let errorMsg: string | undefined = undefined;

  try {
    const subject = "New Reservation — Black Orchid";
    const plainText = [
      `Black Orchid — New Reservation`,
      ``,
      `Reservation ID:`,
      `${reservation.id}`,
      ``,
      `Customer:`,
      `${reservation.name}`,
      ``,
      `Phone:`,
      `${reservation.phone}`,
      ``,
      `Email:`,
      `${reservation.email}`,
      ``,
      `Date:`,
      `${reservation.date}`,
      ``,
      `Time:`,
      `${reservation.time}`,
      ``,
      `Guests:`,
      `${reservation.guests}`,
      ``,
      `Kids:`,
      `${reservation.kids || 0}`,
      ``,
      `Special Requests:`,
      `${reservation.special || "None"}`,
      ``,
      `Status:`,
      `${reservation.status}`,
    ].join("\n");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #F8FAFC; padding: 28px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #333;">
        <h2 style="color: #D4AF37; margin-bottom: 20px; font-size: 22px; text-transform: uppercase;">Black Orchid — New Reservation</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #141414; border: 1px solid #262626; border-radius: 8px; overflow: hidden;">
          <tbody>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; width: 140px; font-size: 13px;">Reservation ID:</td><td style="padding: 12px; color: #D4AF37; font-weight: bold; font-family: monospace; font-size: 14px;">${reservation.id}</td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Customer:</td><td style="padding: 12px; color: #F8FAFC; font-weight: bold; font-size: 14px;">${reservation.name}</td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Phone:</td><td style="padding: 12px; color: #F8FAFC;"><a href="tel:${reservation.phone}" style="color: #60A5FA; text-decoration: none;">${reservation.phone}</a></td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Email:</td><td style="padding: 12px; color: #F8FAFC;"><a href="mailto:${reservation.email}" style="color: #60A5FA; text-decoration: none;">${reservation.email}</a></td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Date:</td><td style="padding: 12px; color: #F8FAFC; font-weight: bold; font-size: 14px;">${reservation.date}</td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Time:</td><td style="padding: 12px; color: #F8FAFC; font-weight: bold; font-size: 14px;">${reservation.time}</td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Guests:</td><td style="padding: 12px; color: #F8FAFC; font-size: 14px;">${reservation.guests}</td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Kids:</td><td style="padding: 12px; color: #F8FAFC; font-size: 14px;">${reservation.kids || 0}</td></tr>
            <tr style="border-bottom: 1px solid #262626;"><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Special Requests:</td><td style="padding: 12px; color: #F59E0B; font-size: 14px;">${reservation.special || "None"}</td></tr>
            <tr><td style="padding: 12px; color: #94A3B8; font-size: 13px;">Status:</td><td style="padding: 12px; color: #34D399; font-weight: bold; font-size: 14px;">${reservation.status}</td></tr>
          </tbody>
        </table>
      </div>
    `;

    const resendResult = await sendEmailViaResend({
      to: managerEmail,
      subject,
      html: htmlContent,
      text: plainText,
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
 * Master Dispatcher: Evaluates Manager Email priority & triggers Resend + Twilio
 */
export async function dispatchReservationNotifications(
  reservation: Reservation,
  origin: string = ""
): Promise<{ email: "SENT" | "FAILED" | "DISABLED" | "SKIPPED"; sms: "SENT" | "FAILED" | "DISABLED" | "SKIPPED" }> {
  try {
    const settings = await db.siteSettings.findUnique({ where: { id: "singleton" } });
    const notificationsEnabled = settings?.notificationsEnabled ?? true;

    if (!notificationsEnabled) {
      console.log(`[Notification Engine] Notifications disabled in Admin Settings.`);
      return { email: "DISABLED", sms: "DISABLED" };
    }

    // Manager Email resolution priority: 1. managerEmail, 2. email, 3. process.env.MANAGER_EMAIL
    const managerEmail = settings?.managerEmail || settings?.email || process.env.MANAGER_EMAIL || "";
    const smsSenderName = settings?.smsSenderName || "Black Orchid Anna Nagar";

    const [emailRes, smsRes] = await Promise.allSettled([
      sendManagerEmailNotification(reservation, managerEmail, origin),
      sendCustomerSmsNotification(reservation, smsSenderName),
    ]);

    const emailStatus = emailRes.status === "fulfilled" ? emailRes.value : "FAILED";
    const smsStatus = smsRes.status === "fulfilled" ? smsRes.value : "FAILED";

    return { email: emailStatus, sms: smsStatus };
  } catch (err) {
    console.error("[Notification Engine Fatal Error]", err);
    return { email: "FAILED", sms: "FAILED" };
  }
}
