import { BookingRecord, COURTS } from "@/lib/bookingStore";

/**
 * Sends the "booking confirmed" email(s) after a payment is verified and the
 * booking is confirmed, via Resend (https://resend.com).
 *
 * Never throws — any failure is logged but swallowed, so a broken email
 * provider can never break the booking/payment flow itself.
 *
 * Setup:
 * 1. Sign up at https://resend.com and grab an API key.
 * 2. Verify a domain you own at resend.com/domains (adds a few DNS records).
 *    Until verified, Resend's sandbox mode only allows sending to the email
 *    you signed up with — verifying the domain removes that restriction.
 * 3. Set RESEND_API_KEY, EMAIL_FROM (using your verified domain), and
 *    OWNER_EMAIL in .env.local — see .env.example.
 */
export async function sendBookingConfirmationEmails(
  booking: BookingRecord,
): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[email] RESEND_API_KEY is not set — skipping booking confirmation emails.",
      );
      return;
    }

    const fromAddress =
      process.env.EMAIL_FROM || "OnePitch Turf <onboarding@resend.dev>";
    const ownerEmail = process.env.OWNER_EMAIL || "onepitchturf@gmail.com";

    const court = COURTS[booking.courtId];
    const formattedDate = formatDisplayDate(booking.date);

    const tasks: Promise<void>[] = [];

    // 1. Confirmation email to the customer (only if they provided an email)
    if (booking.customerEmail && booking.customerEmail.trim()) {
      tasks.push(
        sendEmail({
          apiKey,
          from: fromAddress,
          to: booking.customerEmail.trim(),
          subject: `Booking Confirmed - ${court.name} on ${formattedDate} (${booking.bookingRef})`,
          html: buildCustomerEmailHtml(booking, formattedDate),
        }),
      );
    }

    // 2. Notification email to the turf owner
    if (ownerEmail) {
      tasks.push(
        sendEmail({
          apiKey,
          from: fromAddress,
          to: ownerEmail,
          subject: `New Paid Booking - ${court.name} on ${formattedDate} (${booking.bookingRef})`,
          html: buildOwnerEmailHtml(booking, formattedDate),
        }),
      );
    }

    const results = await Promise.allSettled(tasks);
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error("[email] Failed to send booking email:", result.reason);
      }
    });
  } catch (error) {
    console.error(
      "[email] Unexpected error sending booking confirmation emails:",
      error,
    );
  }
}

async function sendEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
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

function baseStyles() {
  return `font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0b1120; padding:32px 0;`;
}

function cardWrapper(innerHtml: string) {
  return `
  <div style="${baseStyles()}">
    <div style="max-width:520px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
      <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px 28px;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:0.5px;">OnePitch Turf</h1>
      </div>
      <div style="padding:28px;color:#e5e7eb;">
        ${innerHtml}
      </div>
      <div style="padding:16px 28px;background:#0b1120;color:#6b7280;font-size:12px;text-align:center;">
        This is an automated message from OnePitch Turf's booking system.
      </div>
    </div>
  </div>`;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:6px 0;color:#9ca3af;font-size:13px;width:40%;">${label}</td>
      <td style="padding:6px 0;color:#f3f4f6;font-size:14px;font-weight:600;">${value}</td>
    </tr>`;
}

function buildCustomerEmailHtml(
  booking: BookingRecord,
  formattedDate: string,
): string {
  const court = COURTS[booking.courtId];
  const inner = `
    <p style="margin:0 0 4px;font-size:16px;color:#f3f4f6;">Hi ${escapeHtml(booking.customerName)},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">Your payment was successful and your slot is confirmed. See you on the pitch!</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      ${detailRow("Booking Ref", booking.bookingRef)}
      ${detailRow("Court", court.name)}
      ${detailRow("Date", formattedDate)}
      ${detailRow("Time", `${booking.startTime} - ${booking.endTime}`)}
      ${detailRow("Duration", `${booking.durationHours} hour${booking.durationHours > 1 ? "s" : ""}`)}
      ${booking.sportType ? detailRow("Sport", booking.sportType) : ""}
      ${booking.teamName ? detailRow("Team Name", escapeHtml(booking.teamName)) : ""}
      ${detailRow("Amount Paid", `Rs. ${booking.priceTotal}`)}
      ${detailRow("Payment ID", booking.paymentId || "-")}
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;">Please arrive 10 minutes before your slot. If you need to make changes, reply to this email or contact us directly.</p>
  `;
  return cardWrapper(inner);
}

function buildOwnerEmailHtml(
  booking: BookingRecord,
  formattedDate: string,
): string {
  const court = COURTS[booking.courtId];
  const inner = `
    <p style="margin:0 0 4px;font-size:16px;color:#f3f4f6;">New paid booking received</p>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;">A customer has completed payment and their slot is now confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      ${detailRow("Booking Ref", booking.bookingRef)}
      ${detailRow("Customer", escapeHtml(booking.customerName))}
      ${detailRow("Phone", booking.customerPhone)}
      ${detailRow("Email", booking.customerEmail || "-")}
      ${detailRow("Court", court.name)}
      ${detailRow("Date", formattedDate)}
      ${detailRow("Time", `${booking.startTime} - ${booking.endTime}`)}
      ${booking.sportType ? detailRow("Sport", booking.sportType) : ""}
      ${booking.teamName ? detailRow("Team Name", escapeHtml(booking.teamName)) : ""}
      ${detailRow("Amount Paid", `Rs. ${booking.priceTotal}`)}
      ${detailRow("Payment ID", booking.paymentId || "-")}
      ${detailRow("Order ID", booking.orderId || "-")}
    </table>
  `;
  return cardWrapper(inner);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#039;")
    .replace(/"/g, "&quot;");
}
