import twilio from "twilio";

export type SendSmsOptions = {
  to: string;
  body: string;
};

export type SendSmsResult = {
  success: boolean;
  sid?: string;
  error?: string;
};

const TWILIO_TIMEOUT_MS = 10000; // 10-second timeout

/**
 * Twilio SMS Delivery Adapter (Server-Side Only)
 */
export async function sendSmsViaTwilio(options: SendSmsOptions): Promise<SendSmsResult> {
  const isMock = process.env.NOTIFICATION_TEST_MODE === "mock";

  // Mock mode explicitly used by automated test scripts
  if (isMock) {
    console.log(`[Twilio Adapter MOCK] SMS to ${options.to}:\n"${options.body}"`);
    return {
      success: true,
      sid: `mock_twilio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  // Production Execution: Require real Twilio credentials
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    const missing = [
      !accountSid && "TWILIO_ACCOUNT_SID",
      !authToken && "TWILIO_AUTH_TOKEN",
      !fromPhone && "TWILIO_PHONE_NUMBER",
    ].filter(Boolean).join(", ");

    const errorMsg = `Missing required Twilio production configuration (${missing})`;
    console.error(`[Twilio Adapter Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const client = twilio(accountSid, authToken);

    // Promise with 10-second timeout guard
    const sendPromise = client.messages.create({
      body: options.body,
      from: fromPhone,
      to: options.to,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Twilio API request timed out after 10s")), TWILIO_TIMEOUT_MS)
    );

    const message = await Promise.race([sendPromise, timeoutPromise]);

    if (message?.sid) {
      console.log(`[Twilio API Success] SMS accepted by Twilio SID: ${message.sid} for ${options.to}`);
      return { success: true, sid: message.sid };
    }

    return { success: false, error: "Twilio returned no message SID" };
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Twilio Adapter Exception] To: ${options.to} | ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
