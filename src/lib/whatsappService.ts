import { BookingRecord, COURTS } from "@/lib/bookingStore";
import { formatToE164 } from "@/lib/phoneValidation";

// Kept server-side: never expose a Cloud API access token with NEXT_PUBLIC_.
export const OWNER_WHATSAPP_NUMBER =
  process.env.OWNER_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_OWNER_WHATSAPP || "9952323211";
export const VENUE_GPS_LINK = process.env.NEXT_PUBLIC_VENUE_GPS_LINK || "https://maps.google.com/?q=11.2333,78.8833";

export type WhatsAppNotificationResult = { success: boolean; customerSent: boolean; ownerSent: boolean; details: string };
type CloudTemplate = { name: string; language: string };

export function getCourtLabel(courtId: string): string {
  if (courtId === "F") return "Full Ground (F)";
  const court = COURTS[courtId as keyof typeof COURTS];
  return court ? `${court.name} (${courtId})` : courtId;
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// not used code in program "generateCustomerTicketMessage"
export function generateCustomerTicketMessage(booking: BookingRecord): string {
  const duration = `${booking.durationHours} ${booking.durationHours === 1 ? "hour" : "hours"}`;
  return [
    "ONEPITCH TURF - BOOKING CONFIRMED",
    `Hello ${booking.customerName}, your booking is confirmed.`,
    `Booking ID: ${booking.bookingRef}`,
    `Court: ${getCourtLabel(booking.courtId)}`,
    `Date: ${formatDateDisplay(booking.date)}`,
    `Time: ${booking.startTime} - ${booking.endTime} (${duration})`,
    `Sport: ${booking.sportType || "Cricket"}`,
    booking.teamName ? `Team: ${booking.teamName}` : "",
    `Amount paid: Rs. ${booking.priceTotal.toLocaleString("en-IN")}`,
    `Payment ID: ${booking.paymentId || "PAID"}`,
    "Venue: OnePitch Turf, Collector Office Road, Perambalur",
    `Location: ${VENUE_GPS_LINK}`,
    "Please arrive 10 minutes before your slot. Thank you!",
  ].filter(Boolean).join("\n");
}
export function generateOwnerAlertMessage(booking: BookingRecord): string {
  return [
    "*NEW ONEPITCH TURF BOOKING*",
    "",
    `*Booking ID:* ${booking.bookingRef}`,
    "",
    "*CUSTOMER DETAILS*",
    `*Customer:* ${booking.customerName}`,
    `*Phone:* +${formatToE164(booking.customerPhone)}`,
    "",
    "*BOOKING DETAILS*",
    `*Court:* ${getCourtLabel(booking.courtId)}`,
    `*Date:* ${formatDateDisplay(booking.date)}`,
    `*Time:* ${booking.startTime} - ${booking.endTime}`,
    `*Sport:* ${booking.sportType || "Cricket"}`,
    `*Team:* ${booking.teamName || "Not provided"}`,
    "",
    "*PAYMENT DETAILS*",
    `*Amount:* Rs. ${booking.priceTotal.toLocaleString("en-IN")}`,
    `*Payment ID:* ${booking.paymentId || "Not available"}`,
    `*Order ID:* ${booking.orderId || "Not available"}`,
  ].join("\n");
}

export function getCustomerWhatsAppUrl(booking: BookingRecord): string {
  return `https://wa.me/${formatToE164(booking.customerPhone)}?text=${encodeURIComponent(generateCustomerTicketMessage(booking))}`;
}
export function getOwnerWhatsAppUrl(booking: BookingRecord): string {
  return `https://wa.me/${formatToE164(OWNER_WHATSAPP_NUMBER)}?text=${encodeURIComponent(generateOwnerAlertMessage(booking))}`;
}

function cloudTemplate(recipient: "customer" | "owner"): CloudTemplate | null {
  const name = recipient === "customer" ? process.env.WHATSAPP_CUSTOMER_TEMPLATE_NAME : process.env.WHATSAPP_OWNER_TEMPLATE_NAME;
  return name ? { name, language: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" } : null;
}

async function sendCloudTemplate(to: string, message: string, template: CloudTemplate): Promise<void> {
  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error("WhatsApp Cloud API is not configured.");
  const version = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: template.name, language: { code: template.language }, components: [{ type: "body", parameters: [{ type: "text", text: message }] }] } }),
  });
  if (!response.ok) throw new Error(`Cloud API ${response.status}: ${await response.text()}`);
}

async function sendGateway(to: string, body: string): Promise<void> {
  const url = process.env.WHATSAPP_GATEWAY_URL;
  const token = process.env.WHATSAPP_GATEWAY_TOKEN;
  if (!url || !token) throw new Error("WhatsApp is not configured. Add Cloud API credentials or gateway credentials.");
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ to, body }) });
  if (!response.ok) throw new Error(`Gateway ${response.status}: ${await response.text()}`);
}

async function send(recipient: "customer" | "owner", to: string, message: string): Promise<void> {
  if (process.env.WHATSAPP_CLOUD_ACCESS_TOKEN && process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID) {
    const template = cloudTemplate(recipient);
    if (!template) throw new Error(`WHATSAPP_${recipient.toUpperCase()}_TEMPLATE_NAME is required for Cloud API delivery.`);
    return sendCloudTemplate(to, message, template);
  }
  return sendGateway(to, message);
}

/** Sends after confirmation; notification failure never reverses a paid booking. */
export async function sendDualWhatsAppNotifications(booking: BookingRecord): Promise<WhatsAppNotificationResult> {
  const attempts = await Promise.allSettled([
    send("customer", formatToE164(booking.customerPhone), generateCustomerTicketMessage(booking)),
    send("owner", formatToE164(OWNER_WHATSAPP_NUMBER), generateOwnerAlertMessage(booking)),
  ]);
  const customerSent = attempts[0].status === "fulfilled";
  const ownerSent = attempts[1].status === "fulfilled";
  const errors = attempts.flatMap((attempt, index) => attempt.status === "rejected" ? [`${index === 0 ? "customer" : "owner"}: ${String(attempt.reason)}`] : []);
  if (errors.length) console.error(`[WhatsApp] ${booking.bookingRef}: ${errors.join("; ")}`);
  return { success: customerSent && ownerSent, customerSent, ownerSent, details: errors.length ? errors.join("; ") : "Customer and owner notifications accepted by provider." };
}
