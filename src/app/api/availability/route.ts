import { NextRequest, NextResponse } from "next/server";
import {
  calculateAvailability,
  CourtId,
  COURTS,
  formatISODate,
} from "@/lib/bookingStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courtParam = (searchParams.get("court") || "C1") as CourtId;
    const dateParam = searchParams.get("date") || formatISODate(new Date());

    if (!["C1", "C2", "F"].includes(courtParam)) {
      return NextResponse.json(
        { success: false, error: "Invalid court parameter. Must be C1, C2, or F." },
        { status: 400 }
      );
    }

    const slots = calculateAvailability(courtParam, dateParam);

    const availableCount = slots.filter((s) => s.status === "AVAILABLE").length;
    const bookedCount = slots.filter((s) => s.status === "BOOKED").length;
    const unavailableCount = slots.filter(
      (s) => s.status === "UNAVAILABLE"
    ).length;
    const expiredCount = slots.filter((s) => s.status === "EXPIRED").length;

    return NextResponse.json({
      success: true,
      court: COURTS[courtParam],
      date: dateParam,
      stats: {
        total: slots.length,
        available: availableCount,
        booked: bookedCount,
        unavailable: unavailableCount,
        expired: expiredCount,
      },
      slots,
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate slot availability." },
      { status: 500 }
    );
  }
}
