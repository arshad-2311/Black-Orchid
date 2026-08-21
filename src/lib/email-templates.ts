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
    `An evening of culinary theatre awaits.`,
    ``,
    `GUEST: ${reservation.name}`,
    `DATE: ${luxuryDate}`,
    `TIME: ${reservation.time}`,
    `PARTY SIZE: ${reservation.guests} Guests ${reservation.kids && reservation.kids > 0 ? `(${reservation.kids} Kids)` : ""}`,
    `PASS CODE: #${reservation.id.slice(0, 8).toUpperCase()}`,
    `STATUS: Confirmed`,
    ``,
    reservation.special ? `SPECIAL REQUESTS: ${reservation.special}\n` : ``,
    `VIEW YOUR PASS: ${verifyPassUrl}`,
    `ADD TO GOOGLE CALENDAR: ${calendarUrl}`,
    `WHATSAPP CONCIERGE: +91 95850 18502`,
    ``,
    `ADDRESS: G Block, L33, 1st Avenue, Anna Nagar East, Chennai - 600102`,
    `Your table is held for 15 minutes past the reservation time.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body, p, h1, h2, h3, table, td { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .ticket-box { padding: 24px 18px !important; }
      .button-col { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
      .stat-col { display: block !important; width: 100% !important; margin-bottom: 16px !important; }
    }
  </style>
</head>
<body style="background-color: #070709; margin: 0; padding: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070709;" class="email-wrapper">
    <tr>
      <td align="center" style="padding: 36px 12px 48px 12px;">
        
        <!-- MAIN CONTAINER -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
          
          <!-- BRAND CREST HEADER -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="font-family: 'Cinzel', Georgia, serif; font-size: 11px; letter-spacing: 0.35em; color: #D4AF37; text-transform: uppercase; margin-bottom: 6px;">
                      ✦ &nbsp; EST. 2023 &nbsp; ✦
                    </p>
                    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; letter-spacing: 0.12em; color: #FFFFFF; text-transform: uppercase; margin: 0;">
                      BLACK ORCHID
                    </h1>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 13px; letter-spacing: 0.2em; color: #A1A1AA; text-transform: uppercase; margin-top: 6px;">
                      Fine Dining &amp; Banquet &bull; Anna Nagar
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- VIP PASS TICKET CARD -->
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F0F12; border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.8);">
                
                <!-- GOLD HEADER BAR -->
                <tr>
                  <td style="background: linear-gradient(90deg, #997B20 0%, #D4AF37 50%, #F3E5AB 100%); padding: 10px 24px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.25em; color: #070709; text-transform: uppercase;">
                            VIP DIGITAL DINING PASS
                          </span>
                        </td>
                        <td align="right">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; color: #070709; text-transform: uppercase; background-color: rgba(255,255,255,0.3); padding: 3px 8px; border-radius: 99px;">
                            CONFIRMED &bull; ACTIVE
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- TICKET BODY -->
                <tr>
                  <td style="padding: 32px 28px 24px 28px;" class="ticket-box">
                    
                    <!-- SALUTATION -->
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 18px; color: #D4AF37; margin-bottom: 6px;">
                      An evening awaits you,
                    </p>
                    <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 600; color: #FFFFFF; margin: 0 0 16px 0; letter-spacing: 0.02em;">
                      ${reservation.name}
                    </h2>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #A1A1AA; margin-bottom: 26px;">
                      Your table has been reserved with distinction. Our master chefs and maître d&apos; look forward to curating an extraordinary dining experience.
                    </p>

                    <!-- DATE & TIME HERO BOX -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #16161B; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width: 55%;" class="stat-col">
                                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 4px;">
                                  DATE &amp; EVENING
                                </p>
                                <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 600; color: #FFFFFF; margin: 0;">
                                  ${luxuryDate}
                                </p>
                              </td>
                              <td style="width: 45%; border-left: 1px solid rgba(255, 255, 255, 0.08); padding-left: 18px;" class="stat-col">
                                <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-bottom: 4px;">
                                  SERVICE TIME
                                </p>
                                <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #D4AF37; margin: 0;">
                                  ${reservation.time}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- DETAILS GRID -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px dashed rgba(255, 255, 255, 0.15); border-bottom: 1px dashed rgba(255, 255, 255, 0.15); padding: 18px 0; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 6px 0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="left" style="color: #71717A; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em;">Party Size</td>
                              <td align="right" style="color: #FFFFFF; font-size: 14px; font-weight: 600;">
                                ${reservation.guests} ${reservation.guests === 1 ? "Guest" : "Guests"} ${reservation.kids && reservation.kids > 0 ? `&bull; ${reservation.kids} Kids` : ""}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="left" style="color: #71717A; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em;">Pass ID</td>
                              <td align="right" style="color: #D4AF37; font-family: monospace; font-size: 14px; font-weight: 700;">
                                #${reservation.id.slice(0, 8).toUpperCase()}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="left" style="color: #71717A; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em;">Contact Phone</td>
                              <td align="right" style="color: #E4E4E7; font-size: 13px;">${reservation.phone}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${
                        reservation.special
                          ? `<tr>
                              <td style="padding: 8px 0 2px 0;">
                                <p style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 3px;">Special Requests</p>
                                <p style="color: #F3E5AB; font-family: Georgia, serif; font-style: italic; font-size: 13px; margin: 0; background: rgba(212,175,55,0.06); padding: 8px 12px; border-radius: 6px; border-left: 2px solid #D4AF37;">
                                  &ldquo;${reservation.special}&rdquo;
                                </p>
                              </td>
                            </tr>`
                          : ""
                      }
                    </table>

                    <!-- PRIMARY CTA: VIEW DIGITAL PASS & CALENDAR -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                      <tr>
                        <td align="center">
                          <a href="${verifyPassUrl}" target="_blank" style="display: block; width: 100%; background: linear-gradient(135deg, #E5C358 0%, #D4AF37 50%, #B89220 100%); color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);">
                            ✦ &nbsp; VIEW DIGITAL DINING PASS &amp; QR CODE &nbsp; ✦
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- SECONDARY ACTIONS -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 48%;" class="button-col">
                          <a href="${calendarUrl}" target="_blank" style="display: block; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 12px 14px; border-radius: 10px; text-align: center;">
                            📅 &nbsp; Add to Calendar
                          </a>
                        </td>
                        <td style="width: 4%;"></td>
                        <td style="width: 48%;" class="button-col">
                          <a href="${whatsappUrl}" target="_blank" style="display: block; background-color: rgba(37, 211, 102, 0.12); border: 1px solid rgba(37, 211, 102, 0.35); color: #25D366; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 12px 14px; border-radius: 10px; text-align: center;">
                            💬 &nbsp; WhatsApp Concierge
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- DINING ETIQUETTE & DETAILS -->
                <tr>
                  <td style="background-color: #0B0B0E; border-top: 1px solid rgba(255,255,255,0.06); padding: 22px 28px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #D4AF37; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
                            DINING NOTES &amp; ETIQUETTE
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="font-size: 12px; color: #A1A1AA; line-height: 1.6; margin-bottom: 6px;">
                            &bull; &nbsp; <strong style="color: #E4E4E7;">Grace Period:</strong> Tables are held for 15 minutes past your reserved time.
                          </p>
                          <p style="font-size: 12px; color: #A1A1AA; line-height: 1.6; margin-bottom: 6px;">
                            &bull; &nbsp; <strong style="color: #E4E4E7;">Dress Code:</strong> Smart Elegant / Evening attire is recommended.
                          </p>
                          <p style="font-size: 12px; color: #A1A1AA; line-height: 1.6;">
                            &bull; &nbsp; <strong style="color: #E4E4E7;">Valet Service:</strong> Complimentary valet parking is available at the main foyer.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 32px; text-align: center;">
              <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #D4AF37; margin-bottom: 8px;">
                Black Orchid
              </p>
              <p style="font-size: 12px; color: #71717A; line-height: 1.6; margin-bottom: 12px;">
                G Block, L33, 1st Avenue, Anna Nagar East, Chennai &ndash; 600102<br>
                Direct Reservations &amp; Inquiries: <a href="tel:+919585018502" style="color: #D4AF37; text-decoration: none; font-weight: 600;">+91 95850 18502</a>
              </p>
              <p style="font-size: 11px; color: #52525B;">
                <a href="${mapsUrl}" target="_blank" style="color: #A1A1AA; text-decoration: underline; margin: 0 8px;">Get Directions</a> &bull;
                <a href="https://www.instagram.com/blackorchid_annanagar/?hl=en" target="_blank" style="color: #A1A1AA; text-decoration: underline; margin: 0 8px;">Instagram</a> &bull;
                <a href="${origin}" target="_blank" style="color: #A1A1AA; text-decoration: underline; margin: 0 8px;">Website</a>
              </p>
              <p style="font-size: 10px; color: #3F3F46; margin-top: 16px;">
                &copy; ${new Date().getFullYear()} Black Orchid. All rights reserved. Crafted for extraordinary evenings.
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

  const subject = `✦ New Reservation Alert: ${reservation.name} (${reservation.guests} Guests, ${reservation.time})`;

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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="background-color: #070709; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; margin: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #0F0F12; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="background: linear-gradient(90deg, #997B20 0%, #D4AF37 100%); padding: 12px 24px;">
        <p style="margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.25em; color: #070709; text-transform: uppercase;">
          BLACK ORCHID &bull; EXECUTIVE MAÎTRE D&apos; ALERT
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 24px;">
        <h2 style="font-family: Georgia, serif; font-size: 22px; color: #FFFFFF; margin: 0 0 16px 0;">
          New Booking Received
        </h2>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #16161B; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #D4AF37;">${reservation.name}</p>
              <p style="margin: 0; font-size: 13px; color: #A1A1AA;">
                <strong>${luxuryDate}</strong> &bull; <strong style="color: #FFFFFF;">${reservation.time}</strong> &bull; 
                ${reservation.guests} Guests ${reservation.kids && reservation.kids > 0 ? `(+${reservation.kids} Kids)` : ""}
              </p>
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #71717A; width: 120px;">Phone:</td>
            <td style="padding: 6px 0;"><a href="tel:${reservation.phone}" style="color: #60A5FA; text-decoration: none; font-weight: 600;">${reservation.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #71717A;">Email:</td>
            <td style="padding: 6px 0;"><a href="mailto:${reservation.email}" style="color: #60A5FA; text-decoration: none;">${reservation.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #71717A;">Pass ID:</td>
            <td style="padding: 6px 0; color: #D4AF37; font-family: monospace; font-weight: 700;">#${reservation.id.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #71717A;">Special Notes:</td>
            <td style="padding: 6px 0; color: #F59E0B;">${reservation.special || "None"}</td>
          </tr>
        </table>

        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${adminUrl}" target="_blank" style="display: inline-block; background-color: #D4AF37; color: #070709; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
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
