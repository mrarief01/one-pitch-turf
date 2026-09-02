import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { confirmBooking, CourtId } from "@/lib/bookingStore";

export const runtime = "nodejs";

function isCourtId(value: unknown): value is CourtId {
  return value === "C1" || value === "C2" || value === "F";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      holdToken,
      courtId,
      date,
      slotIds,
      customerName,
      customerPhone,
      customerEmail,
      teamName,
      sportType,
    } = body;

    if (!isCourtId(courtId) || typeof date !== "string" || !Array.isArray(slotIds) || !slotIds.length || !holdToken || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing or invalid payment verification details." }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, error: "Razorpay is not configured." }, { status: 503 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const signaturesMatch =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpay_signature));
    if (!signaturesMatch) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed. Invalid digital signature." },
        { status: 400 }
      );
    }

    // Atomically confirm booking with payment ID
    const confirmResult = confirmBooking({
      holdToken,
      courtId,
      date,
      slotIds,
      customerName,
      customerPhone,
      customerEmail,
      teamName,
      sportType,
      paymentId: razorpay_payment_id || `pay_upi_${Date.now()}`,
      orderId: razorpay_order_id,
      paymentMethod: "UPI",
      paymentStatus: "PAID",
    });

    if (!confirmResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: confirmResult.error || "Unable to confirm booking slot.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and booking confirmed successfully.",
      booking: confirmResult.booking,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error verifying Razorpay payment." },
      { status: 500 }
    );
  }
}
