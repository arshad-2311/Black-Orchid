import { Resend } from "resend";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

const RESEND_TIMEOUT_MS = 10000; // 10-second timeout

/**
 * Resend Email Delivery Adapter (Server-Side Only)
 */
export async function sendEmailViaResend(options: SendEmailOptions): Promise<SendEmailResult> {
  const isMock = process.env.NOTIFICATION_TEST_MODE === "mock";

  // Mock mode explicitly used by automated test scripts
  if (isMock) {
    console.log(`[Resend Adapter MOCK] Email to ${options.to} | Subject: "${options.subject}"`);
    return {
      success: true,
      messageId: `mock_resend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  // Production Execution: Require real Resend credentials
  const apiKey = process.env.RESEND_API_KEY;
  let fromEmail = process.env.RESEND_FROM_EMAIL || "Black Orchid <onboarding@resend.dev>";

  // If user provided a raw email without domain verification or onboarding@resend.dev, default to onboarding@resend.dev for Resend API compliance
  if (fromEmail.includes("@gmail.com") || fromEmail.includes("@yahoo.com") || !fromEmail.includes("<")) {
    fromEmail = "Black Orchid <onboarding@resend.dev>";
  }

  if (!apiKey) {
    const errorMsg = "Missing required RESEND_API_KEY production configuration";
    console.error(`[Resend Adapter Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const resend = new Resend(apiKey);

    // Promise with 10-second timeout guard
    const sendPromise = resend.emails.send({
      from: fromEmail,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Resend API request timed out after 10s")), RESEND_TIMEOUT_MS)
    );

    const response = await Promise.race([sendPromise, timeoutPromise]);

    if (response.error) {
      const errStr = response.error.message || JSON.stringify(response.error);
      console.error(`[Resend API Error] To: ${options.to} | Error: ${errStr}`);
      return { success: false, error: `Resend error: ${errStr}` };
    }

    if (response.data?.id) {
      console.log(`[Resend API Success] Email accepted by Resend ID: ${response.data.id} for ${options.to}`);
      return { success: true, messageId: response.data.id };
    }

    return { success: false, error: "Resend returned no message ID" };
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Resend Adapter Exception] To: ${options.to} | ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
