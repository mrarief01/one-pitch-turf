import { NextRequest, NextResponse } from "next/server";
import { BookingRecord } from "@/lib/bookingStore";
import { sendDualWhatsAppNotifications } from "@/lib/whatsappService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking } = body as { booking: BookingRecord };

    if (!booking || !booking.id || !booking.customerPhone) {
      return NextResponse.json(
        { success: false, error: "Invalid booking details provided for WhatsApp notification." },
        { status: 400 }
      );
    }

    const result = await sendDualWhatsAppNotifications(booking);

    return NextResponse.json({
      success: true,
      message: "Dual WhatsApp Engine executed successfully.",
      result,
    });
  } catch (error) {
    console.error("WhatsApp notification API error:", error);
    return NextResponse.json(
      { success: false, error: "Server error triggering WhatsApp notifications." },
      { status: 500 }
    );
  }
}
