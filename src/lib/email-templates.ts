import type { Reservation } from "./types";

/**
 * Generates a direct Google Calendar "Add Event" URL for the reservation
 */
export function generateGoogleCalendarUrl(reservation: Reservation): string {
  try {
    const [year, month, day] = reservation.date.split("-").map(Number);
    // Parse time (e.g. "8:30 PM" or "1:00 PM")
    const timeMatch = reservation.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hours = 20; // default 8pm
    let minutes = 0;
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = parseInt(timeMatch[2], 10);
      const meridian = timeMatch[3].toUpperCase();
      if (meridian === "PM" && h < 12) h += 12;
      if (meridian === "AM" && h === 12) h = 0;
      hours = h;
      minutes = m;
    }

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatUtc = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const title = encodeURIComponent("Dinner at Black Orchid — Fine Dining & Banquet");
    const dates = `${formatUtc(startDate)}/${formatUtc(endDate)}`;
    const details = encodeURIComponent(
      `Table Reservation at Black Orchid for ${reservation.name} (${reservation.guests} Guests).\nReservation Pass ID: ${reservation.id}\nSpecial Requests: ${reservation.special || "None"}\nPhone: +91 95850 18502`
    );
    const location = encodeURIComponent("Black Orchid, G Block, L33, 1st Avenue, Anna Nagar East, Chennai 600102");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  } catch {
    return "https://calendar.google.com";
  }
}

/**
 * Format date for luxury email display (e.g., "Friday, August 21, 2026")
 */
function formatLuxuryDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * VIP Black & Gold Customer Dining Pass Email Template
 * Precision engineered for 100% mobile responsiveness across iOS Mail, Gmail, Android, Outlook & Superhuman
 */
export function renderCustomerReservationEmail(
  reservation: Reservation,
  origin: string = "https://black-orchid-lime.vercel.app"
): { html: string; text: string; subject: string } {
  const luxuryDate = formatLuxuryDate(reservation.date);
  const calendarUrl = generateGoogleCalendarUrl(reservation);
  const verifyPassUrl = `${origin.replace(/\/+$/, "")}/verify/${reservation.id}`;
  const whatsappUrl = `https://wa.me/919585018502?text=${encodeURIComponent(
    `Hello Black Orchid Concierge, I have a question regarding my reservation #${reservation.id.slice(0, 8)} on ${reservation.date}.`
  )}`;
  const mapsUrl = "https://maps.google.com/?q=Black+Orchid+Anna+Nagar+East+Chennai";

  const subject = `Your VIP Dining Pass — Black Orchid (${reservation.time}, ${luxuryDate})`;

  const text = [
    `BLACK ORCHID — VIP DINING PASS`,
    `An evening of culinary distinction awaits.`,
    ``,
    `GUEST: ${reservation.name}`,
    `DATE: ${luxuryDate}`,
    `TIME: ${reservation.time}`,
    `PARTY SIZE: ${reservation.guests} Guests ${reservation.kids && reservation.kids > 0 ? `(${reservation.kids} Kids)` : ""}`,
    `PASS CODE: #${reservation.id.slice(0, 8).toUpperCase()}`,
    `STATUS: Confirmed`,
    ``,
    reservation.special ? `SPECIAL REQUESTS: ${reservation.special}\n` : ``,
    `VIEW YOUR PASS & QR: ${verifyPassUrl}`,
    `ADD TO GOOGLE CALENDAR: ${calendarUrl}`,
    `WHATSAPP CONCIERGE: +91 95850 18502`,
    ``,
    `ADDRESS: G Block, L33, 1st Avenue, Anna Nagar East, Chennai - 600102`,
    `Your table is held for 15 minutes past the reservation time.`,
  ].join("\n");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>${subject}</title>
  <style type="text/css">
    /* Client resets */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0c0c0e !important; color: #FFFFFF !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* Responsive layout */
    @media only screen and (max-width: 540px) {
      .mobile-wrapper { padding: 12px 6px !important; }
      .mobile-card { width: 100% !important; border-radius: 14px !important; }
      .mobile-content { padding: 20px 16px !important; }
      .mobile-hero-box { padding: 16px 14px !important; }
      .mobile-title { font-size: 22px !important; letter-spacing: 0.08em !important; }
      .mobile-name { font-size: 22px !important; }
      .mobile-time { font-size: 22px !important; }
      .mobile-btn { padding: 14px 12px !important; font-size: 11px !important; }
      .mobile-sub-btn { display: block !important; width: 100% !important; margin-bottom: 10px !important; box-sizing: border-box !important; }
      .mobile-sub-table { display: block !important; width: 100% !important; }
      .mobile-divider { margin: 16px 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e; color: #FFFFFF;">
  <!-- OUTER WRAPPER -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c0e; width: 100%; table-layout: fixed;" class="mobile-wrapper">
    <tr>
      <td align="center" style="padding: 24px 8px 36px 8px;">
        
        <!-- CENTERED CONTAINER -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; width: 100%; margin: 0 auto;">
          
          <!-- BRAND CREST HEADER -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0;">
              <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="font-family: Georgia, serif; font-size: 11px; letter-spacing: 0.3em; color: #D4AF37; text-transform: uppercase; margin: 0 0 4px 0;">
                      ✦ &nbsp; EST. 2023 &nbsp; ✦
                    </p>
                    <h1 class="mobile-title" style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.1em; color: #FFFFFF; text-transform: uppercase; margin: 0; line-height: 1.2;">
                      BLACK ORCHID
                    </h1>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 12px; letter-spacing: 0.18em; color: #A1A1AA; text-transform: uppercase; margin: 4px 0 0 0;">
                      Fine Dining &bull; Anna Nagar
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- VIP PASS TICKET CARD -->
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" class="mobile-card" style="background-color: #141418; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7); width: 100%;">
                
                <!-- GOLD METALLIC HEADER BAR -->
                <tr>
                  <td style="background: linear-gradient(90deg, #997B20 0%, #D4AF37 50%, #F3E5AB 100%); background-color: #D4AF37; padding: 10px 16px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                      <tr>
                        <td align="left" style="vertical-align: middle;">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: #070709; text-transform: uppercase; display: inline-block;">
                            VIP DIGITAL DINING PASS
                          </span>
                        </td>
                        <td align="right" style="vertical-align: middle;">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9px; font-weight: 800; letter-spacing: 0.12em; color: #070709; text-transform: uppercase; background-color: rgba(255,255,255,0.4); padding: 2px 7px; border-radius: 99px; display: inline-block; white-space: nowrap;">
                            CONFIRMED
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- TICKET BODY CONTENT -->
                <tr>
                  <td class="mobile-content" style="padding: 24px 22px;">
                    
                    <!-- SALUTATION & GUEST NAME -->
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 15px; color: #D4AF37; margin: 0 0 4px 0;">
                      An evening awaits you,
                    </p>
                    <h2 class="mobile-name" style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #FFFFFF; margin: 0 0 12px 0; letter-spacing: 0.01em; line-height: 1.2; word-break: break-word;">
                      ${reservation.name}
                    </h2>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.55; color: #A1A1AA; margin: 0 0 20px 0;">
                      Your table reservation is confirmed. We look forward to curating an exceptional culinary journey.
                    </p>

                    <!-- DATE & SERVICE TIME HERO BOX (STACKED FOR MOBILE PERFECTION) -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1A1A22; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin: 0 0 20px 0; width: 100%;">
                      <tr>
                        <td class="mobile-hero-box" style="padding: 16px 18px;">
                          <!-- Date Row -->
                          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; letter-spacing: 0.18em; color: #D4AF37; text-transform: uppercase; margin: 0 0 3px 0;">
                            RESERVED DATE
                          </p>
                          <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 600; color: #FFFFFF; margin: 0 0 12px 0; line-height: 1.3;">
                            ${luxuryDate}
                          </p>

                          <!-- Divider line inside hero -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 12px 0;">
                            <tr>
                              <td style="border-top: 1px solid rgba(255, 255, 255, 0.08);"></td>
                            </tr>
                          </table>

                          <!-- Time & Party Row -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                            <tr>
                              <td align="left" style="vertical-align: top;">
                                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; letter-spacing: 0.18em; color: #D4AF37; text-transform: uppercase; margin: 0 0 3px 0;">
                                  SERVICE TIME
                                </p>
                                <p class="mobile-time" style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #D4AF37; margin: 0; line-height: 1.1;">
                                  ${reservation.time}
                                </p>
                              </td>
                              <td align="right" style="vertical-align: top;">
                                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; letter-spacing: 0.18em; color: #A1A1AA; text-transform: uppercase; margin: 0 0 3px 0;">
                                  PARTY SIZE
                                </p>
                                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF; margin: 0; line-height: 1.2;">
                                  ${reservation.guests} ${reservation.guests === 1 ? "Guest" : "Guests"}
                                  ${reservation.kids && reservation.kids > 0 ? `<span style="font-size: 12px; font-weight: normal; color: #D4AF37;">(+${reservation.kids} Kids)</span>` : ""}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- TICKET ATTRIBUTES (DASHED BORDER CONTAINER) -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px dashed rgba(255, 255, 255, 0.18); border-bottom: 1px dashed rgba(255, 255, 255, 0.18); padding: 12px 0; margin: 0 0 20px 0; width: 100%;">
                      <tr>
                        <td style="padding: 6px 0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                            <tr>
                              <td align="left" style="color: #8E8E93; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;">Pass Code</td>
                              <td align="right" style="color: #D4AF37; font-family: Courier, monospace; font-size: 13px; font-weight: 700;">
                                #${reservation.id.slice(0, 8).toUpperCase()}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                            <tr>
                              <td align="left" style="color: #8E8E93; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em;">Phone</td>
                              <td align="right" style="color: #E4E4E7; font-size: 12px;">${reservation.phone}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${
                        reservation.special
                          ? `<tr>
                              <td style="padding: 8px 0 2px 0;">
                                <p style="color: #8E8E93; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; margin: 0 0 3px 0;">Special Requests</p>
                                <p style="color: #F3E5AB; font-family: Georgia, serif; font-style: italic; font-size: 12px; margin: 0; background: rgba(212,175,55,0.08); padding: 8px 10px; border-radius: 6px; border-left: 2px solid #D4AF37; line-height: 1.4;">
                                  &ldquo;${reservation.special}&rdquo;
                                </p>
                              </td>
                            </tr>`
                          : ""
                      }
                    </table>

                    <!-- PRIMARY CTA: VIEW DIGITAL PASS & QR CODE -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 12px 0; width: 100%;">
                      <tr>
                        <td align="center">
                          <a href="${verifyPassUrl}" target="_blank" class="mobile-btn" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #E5C358 0%, #D4AF37 50%, #B89220 100%); background-color: #D4AF37; color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; text-decoration: none; padding: 14px 16px; border-radius: 10px; text-align: center; line-height: 1.3; box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);">
                            ✦ &nbsp; VIEW DIGITAL PASS &amp; QR &nbsp; ✦
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- SECONDARY ACTIONS: STACKABLE ON MOBILE -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="mobile-sub-table" style="width: 100%;">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <a href="${calendarUrl}" target="_blank" class="mobile-sub-btn" style="display: block; width: 100%; box-sizing: border-box; background-color: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18); color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 11px 14px; border-radius: 8px; text-align: center; line-height: 1.2;">
                            📅 &nbsp; Add to Google Calendar
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <a href="${whatsappUrl}" target="_blank" class="mobile-sub-btn" style="display: block; width: 100%; box-sizing: border-box; background-color: rgba(37, 211, 102, 0.12); border: 1px solid rgba(37, 211, 102, 0.35); color: #25D366; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 11px 14px; border-radius: 8px; text-align: center; line-height: 1.2;">
                            💬 &nbsp; WhatsApp Concierge
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- DINING NOTES & ETIQUETTE FOOTNOTE -->
                <tr>
                  <td style="background-color: #0E0E12; border-top: 1px solid rgba(255,255,255,0.07); padding: 18px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                      <tr>
                        <td style="padding: 0 0 6px 0;">
                          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #D4AF37; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0;">
                            DINING NOTES &amp; ETIQUETTE
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="font-size: 11px; color: #A1A1AA; line-height: 1.55; margin: 0 0 4px 0;">
                            &bull; &nbsp; <strong style="color: #E4E4E7;">Grace Period:</strong> Tables are held for 15 minutes past reservation time.
                          </p>
                          <p style="font-size: 11px; color: #A1A1AA; line-height: 1.55; margin: 0 0 4px 0;">
                            &bull; &nbsp; <strong style="color: #E4E4E7;">Dress Code:</strong> Smart Elegant / Evening attire recommended.
                          </p>
                          <p style="font-size: 11px; color: #A1A1AA; line-height: 1.55; margin: 0;">
                            &bull; &nbsp; <strong style="color: #E4E4E7;">Valet Service:</strong> Complimentary valet available at entrance.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- EMAIL FOOTER -->
          <tr>
            <td align="center" style="padding: 24px 8px 0 8px; text-align: center;">
              <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #D4AF37; margin: 0 0 6px 0; font-weight: 600;">
                Black Orchid
              </p>
              <p style="font-size: 11px; color: #71717A; line-height: 1.5; margin: 0 0 10px 0;">
                G Block, L33, 1st Avenue, Anna Nagar East, Chennai &ndash; 600102<br />
                Direct Concierge: <a href="tel:+919585018502" style="color: #D4AF37; text-decoration: none; font-weight: 600;">+91 95850 18502</a>
              </p>
              <p style="font-size: 11px; color: #52525B; margin: 0;">
                <a href="${mapsUrl}" target="_blank" style="color: #A1A1AA; text-decoration: underline; margin: 0 6px;">Directions</a> &bull;
                <a href="https://www.instagram.com/blackorchid_annanagar/?hl=en" target="_blank" style="color: #A1A1AA; text-decoration: underline; margin: 0 6px;">Instagram</a> &bull;
                <a href="${origin}" target="_blank" style="color: #A1A1AA; text-decoration: underline; margin: 0 6px;">Website</a>
              </p>
              <p style="font-size: 10px; color: #3F3F46; margin: 12px 0 0 0;">
                &copy; ${new Date().getFullYear()} Black Orchid. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text, subject };
}

/**
 * Executive Management Alert Email Template
 */
export function renderManagerAlertEmail(
  reservation: Reservation,
  origin: string = "https://black-orchid-lime.vercel.app"
): { html: string; text: string; subject: string } {
  const luxuryDate = formatLuxuryDate(reservation.date);
  const verifyPassUrl = `${origin.replace(/\/+$/, "")}/verify/${reservation.id}`;
  const adminUrl = `${origin.replace(/\/+$/, "")}/admin`;

  const subject = `✦ New Reservation: ${reservation.name} (${reservation.guests} Guests, ${reservation.time})`;

  const text = [
    `NEW RESERVATION ALERT — BLACK ORCHID`,
    `------------------------------------`,
    `GUEST: ${reservation.name}`,
    `DATE: ${luxuryDate}`,
    `TIME: ${reservation.time}`,
    `PARTY: ${reservation.guests} Adults ${reservation.kids && reservation.kids > 0 ? `, ${reservation.kids} Kids` : ""}`,
    `PHONE: ${reservation.phone}`,
    `EMAIL: ${reservation.email}`,
    `PASS ID: #${reservation.id.slice(0, 8).toUpperCase()}`,
    `SPECIAL REQUESTS: ${reservation.special || "None"}`,
    `STATUS: ${reservation.status}`,
    ``,
    `ADMIN PORTAL: ${adminUrl}`,
    `DIGITAL PASS: ${verifyPassUrl}`,
  ].join("\n");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="background-color: #0c0c0e; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px 8px; margin: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin: 0 auto; background-color: #141418; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 14px; overflow: hidden; table-layout: fixed;">
    <tr>
      <td style="background: linear-gradient(90deg, #997B20 0%, #D4AF37 100%); background-color: #D4AF37; padding: 10px 18px;">
        <p style="margin: 0; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: #070709; text-transform: uppercase;">
          BLACK ORCHID &bull; MAÎTRE D&apos; ALERT
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 22px 18px;">
        <h2 style="font-family: Georgia, serif; font-size: 20px; color: #FFFFFF; margin: 0 0 14px 0;">
          New Booking Received
        </h2>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1A1A22; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; margin-bottom: 16px;">
          <tr>
            <td style="padding: 14px 16px;">
              <p style="margin: 0 0 4px 0; font-size: 17px; font-weight: 700; color: #D4AF37;">${reservation.name}</p>
              <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.4;">
                <strong style="color: #FFFFFF;">${luxuryDate}</strong> &bull; <strong style="color: #D4AF37;">${reservation.time}</strong> &bull; 
                ${reservation.guests} Guests ${reservation.kids && reservation.kids > 0 ? `(+${reservation.kids} Kids)` : ""}
              </p>
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px; font-size: 12px; width: 100%;">
          <tr>
            <td style="padding: 5px 0; color: #8E8E93; width: 100px;">Phone:</td>
            <td style="padding: 5px 0;"><a href="tel:${reservation.phone}" style="color: #60A5FA; text-decoration: none; font-weight: 600;">${reservation.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #8E8E93;">Email:</td>
            <td style="padding: 5px 0;"><a href="mailto:${reservation.email}" style="color: #60A5FA; text-decoration: none;">${reservation.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #8E8E93;">Pass ID:</td>
            <td style="padding: 5px 0; color: #D4AF37; font-family: Courier, monospace; font-weight: 700;">#${reservation.id.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #8E8E93;">Special Notes:</td>
            <td style="padding: 5px 0; color: #F59E0B;">${reservation.special || "None"}</td>
          </tr>
        </table>

        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${adminUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #D4AF37; color: #070709; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 12px 16px; border-radius: 8px; text-align: center;">
                Open Admin Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text, subject };
}
