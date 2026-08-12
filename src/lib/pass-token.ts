export interface PassPayload {
  id: string;
  n: string; // name
  p: string; // phone
  e: string; // email
  d: string; // date
  t: string; // time
  g: number; // guests (adults)
  k: number; // kids
  s?: string; // special requests
}

/**
 * Encodes a reservation pass payload into a URL-safe Base64 string.
 */
export function encodePassToken(data: PassPayload): string {
  try {
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return data.id;
  }
}

/**
 * Decodes a URL-safe Base64 token back into a reservation pass payload.
 */
export function decodePassToken(token: string): PassPayload | null {
  try {
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = decodeURIComponent(atob(base64));
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object" && parsed.n) {
      return parsed as PassPayload;
    }
    return null;
  } catch {
    return null;
  }
}
