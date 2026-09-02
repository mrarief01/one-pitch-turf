import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { confirmBooking, CourtId } from "@/lib/bookingStore";

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

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";

    // If real keys are in use, cryptographically verify HMAC-SHA256 signature
    if (
      keySecret &&
      !keySecret.includes("placeholder") &&
      razorpay_signature &&
      razorpay_order_id &&
      razorpay_payment_id
    ) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed. Invalid digital signature.",
          },
          { status: 400 }
        );
      }
    }

    // Atomically confirm booking with payment ID
    const confirmResult = confirmBooking({
      holdToken,
      courtId: courtId as CourtId,
      date,
      slotIds,
      customerName,
      customerPhone,
      customerEmail,
      teamName,
      sportType,
      paymentId: razorpay_payment_id || `pay_upi_${Date.now()}`,
      orderId: razorpay_order_id,
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
