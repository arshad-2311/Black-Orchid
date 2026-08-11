/**
 * Validates and normalizes customer phone numbers to international E.164 format.
 * Returns null if the phone number is invalid or cannot be parsed cleanly.
 */
export function validateAndNormalizePhone(phone: string, defaultCountryCode: string = "91"): { valid: boolean; normalized: string } {
  if (!phone || typeof phone !== "string") {
    return { valid: false, normalized: "" };
  }

  // Remove all non-digit characters except leading plus
  const hasPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");

  if (!digits || digits.length < 7 || digits.length > 15) {
    return { valid: false, normalized: "" };
  }

  let normalized = "";
  if (hasPlus) {
    normalized = `+${digits}`;
  } else if (digits.length === 10) {
    // Default to Indian country code +91 for 10-digit mobile numbers
    normalized = `+${defaultCountryCode}${digits}`;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    normalized = `+${digits}`;
  } else {
    normalized = `+${digits}`;
  }

  return { valid: true, normalized };
}
