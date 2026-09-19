import { BookingRecord, COURTS } from "@/lib/bookingStore";


// this one is still not a part of the code Will try to merger if only whatappi is open


/**
 * Sends the "booking confirmed" WhatsApp message(s) via Meta's OFFICIAL
 * WhatsApp Business Cloud API (graph.facebook.com) — never throws, so a
 * misconfigured/rate-limited WhatsApp account can never break the
 * booking/payment flow itself.
 *
 * IMPORTANT — Meta requires approved message TEMPLATES for any
 * business-initiated message sent outside a 24h customer-service window.
 * A booking confirmation triggered by your server is exactly that case, so
 * you must create and get two templates approved before this works:
 *
 * Setup (Meta for Developers / Business Manager):
 * 1. Create an app at https://developers.facebook.com/apps, add the
 *    "WhatsApp" product.
 * 2. In WhatsApp > API Setup you get a test Phone Number ID + temporary
 *    access token. For production, go to WhatsApp > Configuration and add
 *    your own business phone number, then generate a permanent token via a
 *    System User in Business Settings (Business Settings > Users > System
 *    Users > Add > generate token with whatsapp_business_messaging +
 *    whatsapp_business_management permissions).
 * 3. In WhatsApp Manager > Message Templates, create two templates (category
 *    "Utility" is the right fit for booking confirmations, and approves fast):
 *      - "booking_confirmed" (for the customer), body e.g.:
 *        "Hi {{1}}, your booking for {{2}} on {{3}} at {{4}} is confirmed.
 *         Amount paid: Rs. {{5}}. Booking Ref: {{6}}. See you on the pitch!"
 *      - "owner_new_booking" (for you), body e.g.:
 *        "New paid booking! {{1}} ({{2}}) booked {{3}} on {{4}} at {{5}}.
 *         Amount: Rs. {{6}}. Ref: {{7}}."
 *    Submit for review — utility templates are usually approved within
 *    minutes to a few hours.
 * 4. Put WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_CUSTOMER,
 *    WHATSAPP_TEMPLATE_OWNER, WHATSAPP_TEMPLATE_LANG, OWNER_WHATSAPP_NUMBER
 *    into .env.local — see .env.example.
 *
 * Numbers must be in international format without "+" or spaces, e.g.
 * "919876543210". Indian 10-digit numbers are auto-prefixed with "91" below.
 */
export async function sendBookingWhatsAppNotifications(
  booking: BookingRecord,
): Promise<void> {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      console.warn(
        "[whatsapp] WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set — skipping booking WhatsApp notifications.",
      );
      return;
    }

    const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
    const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";
    const customerTemplate =
      process.env.WHATSAPP_TEMPLATE_CUSTOMER || "booking_confirmed";
    const ownerTemplate =
      process.env.WHATSAPP_TEMPLATE_OWNER || "owner_new_booking";
    const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;

    const court = COURTS[booking.courtId];
    const formattedDate = formatDisplayDate(booking.date);
    const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const tasks: Promise<void>[] = [];

    // 1. Confirmation message to the customer
    const customerNumber = toE164(booking.customerPhone);
    if (customerNumber) {
      tasks.push(
        sendTemplateMessage({
          endpoint,
          token,
          to: customerNumber,
          templateName: customerTemplate,
          lang,
          params: [
            booking.customerName,
            court.name,
            formattedDate,
            `${booking.startTime} - ${booking.endTime}`,
            String(booking.priceTotal),
            booking.bookingRef,
          ],
        }),
      );
    }

    // 2. Notification to the turf owner
    if (ownerNumber) {
      tasks.push(
        sendTemplateMessage({
          endpoint,
          token,
          to: toE164(ownerNumber) || ownerNumber,
          templateName: ownerTemplate,
          lang,
          params: [
            booking.customerName,
            booking.customerPhone,
            court.name,
            formattedDate,
            `${booking.startTime} - ${booking.endTime}`,
            String(booking.priceTotal),
            booking.bookingRef,
          ],
        }),
      );
    }

    const results = await Promise.allSettled(tasks);
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "[whatsapp] Failed to send booking WhatsApp message:",
          result.reason,
        );
      }
    });
  } catch (error) {
    console.error(
      "[whatsapp] Unexpected error sending booking WhatsApp notifications:",
      error,
    );
  }
}

async function sendTemplateMessage(params: {
  endpoint: string;
  token: string;
  to: string;
  templateName: string;
  lang: string;
  params: string[];
}): Promise<void> {
  const response = await fetch(params.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: params.to,
      type: "template",
      template: {
        name: params.templateName,
        language: { code: params.lang },
        components: [
          {
            type: "body",
            parameters: params.params.map((text) => ({ type: "text", text })),
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`WhatsApp Cloud API error (${response.status}): ${body}`);
  }
}

/**
 * Normalizes a phone number to WhatsApp's expected format: digits only, with
 * country code, no "+". Assumes India (91) for bare 10-digit numbers, since
 * that's what this app currently collects at booking time.
 */
function toE164(rawPhone: string | undefined | null): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length > 10) return digits; // assume it already includes a country code
  return null;
}

function formatDisplayDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}
