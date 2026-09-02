import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import {
  calculateAvailability,
  holdSlots,
  CourtId,
  COURTS,
} from "@/lib/bookingStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courtId,
      date,
      slotIds,
      customerName,
      customerPhone,
      customerEmail,
    } = body;

    if (!courtId || !date || !slotIds || slotIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing court, date, or time slots." },
        { status: 400 }
      );
    }

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: "Please enter player name and mobile number." },
        { status: 400 }
      );
    }

    // 1. Verify real-time availability before creating order
    const availability = calculateAvailability(courtId as CourtId, date);
    for (const slotId of slotIds) {
      const slot = availability.find((s) => s.id === slotId);
      if (!slot || slot.status !== "AVAILABLE") {
        return NextResponse.json(
          {
            success: false,
            error: `Slot ${slot?.label || slotId} is no longer available (${slot?.conflictReason || "Conflict"}).`,
          },
          { status: 409 }
        );
      }
    }

    // 2. Calculate exact total price in INR
    const court = COURTS[courtId as CourtId];
    const duration = slotIds.length;
    const amountInRupees = court.pricePerHour * duration;
    const amountInPaise = amountInRupees * 100;

    // 3. Place temporary hold on slots during checkout
    const holdResult = holdSlots({
      courtId: courtId as CourtId,
      date,
      slotIds,
      customerName,
      customerPhone,
      customerEmail: customerEmail || "",
    });

    if (!holdResult.success) {
      return NextResponse.json(
        { success: false, error: holdResult.error },
        { status: 409 }
      );
    }

    // 4. Initialize Razorpay Order
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      "rzp_test_placeholder_key";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";

    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // If real Razorpay keys are provided, create live order through Razorpay SDK
    if (
      keyId &&
      keySecret &&
      !keyId.includes("placeholder") &&
      !keySecret.includes("placeholder")
    ) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: holdResult.holdToken || `rcpt_${Date.now()}`,
          notes: {
            courtId,
            date,
            slotCount: String(duration),
            customerName,
            customerPhone,
            turfName: "OnePitch Arena",
          },
        });

        orderId = order.id;
      } catch (rzpErr: unknown) {
        console.warn("Razorpay live order error, falling back to secure test order:", rzpErr);
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInRupees,
      amountInPaise,
      currency: "INR",
      keyId,
      holdToken: holdResult.holdToken,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || "onepitchturf@gmail.com",
      },
    });
  } catch (error) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initiate UPI payment order." },
      { status: 500 }
    );
  }
}
