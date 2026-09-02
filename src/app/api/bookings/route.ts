import { NextRequest, NextResponse } from "next/server";
import {
  confirmBooking,
  holdSlots,
  getAllBookings,
  resetBookings,
  CourtId,
} from "@/lib/bookingStore";

export async function GET() {
  try {
    const bookings = getAllBookings();
    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "hold") {
      const { courtId, date, slotIds, customerName, customerPhone, customerEmail } = body;
      if (!courtId || !date || !slotIds || slotIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Missing required booking details for hold." },
          { status: 400 }
        );
      }

      const result = holdSlots({
        courtId: courtId as CourtId,
        date,
        slotIds,
        customerName: customerName || "Guest",
        customerPhone: customerPhone || "",
        customerEmail: customerEmail || "",
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }

      return NextResponse.json({ success: true, holdToken: result.holdToken });
    }

    if (action === "confirm") {
      const {
        holdToken,
        courtId,
        date,
        slotIds,
        customerName,
        customerPhone,
        customerEmail,
        teamName,
        sportType,
        paymentMethod,
      } = body;

      if (!courtId || !date || !slotIds || slotIds.length === 0 || !customerName || !customerPhone) {
        return NextResponse.json(
          { success: false, error: "Please fill in all player contact details." },
          { status: 400 }
        );
      }

      if (paymentMethod !== "VENUE") {
        return NextResponse.json(
          { success: false, error: "Online payments must be confirmed through Razorpay verification." },
          { status: 400 }
        );
      }

      const result = confirmBooking({
        holdToken,
        courtId: courtId as CourtId,
        date,
        slotIds,
        customerName,
        customerPhone,
        customerEmail,
        teamName,
        sportType,
        paymentMethod: paymentMethod === "VENUE" ? "VENUE" : "UPI",
        paymentStatus: paymentMethod === "VENUE" ? "PENDING" : "PAID",
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }

      return NextResponse.json({ success: true, booking: result.booking });
    }

    if (action === "reset") {
      resetBookings();
      return NextResponse.json({ success: true, message: "Bookings reset to seed state." });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action specified." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Booking POST error:", error);
    return NextResponse.json(
      { success: false, error: "Server error processing booking request." },
      { status: 500 }
    );
  }
}
