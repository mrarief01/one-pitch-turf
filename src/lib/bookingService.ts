import {
  BookingRecord,
  CalculatedSlot,
  CourtId,
  COURTS,
  MASTER_SLOTS,
} from "@/lib/bookingStore";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { sendBookingConfirmationEmails } from "@/lib/email";
import { sendBookingWhatsAppNotifications } from "@/lib/whatsapp";

type DbBooking = {
  id: string;
  booking_ref: string;
  court_id: CourtId;
  booking_date: string;
  slot_ids: string[];
  start_time: string;
  end_time: string;
  duration_hours: number;
  price_total: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  team_name: string | null;
  sport_type: string | null;
  status: "HELD" | "CONFIRMED" | "CANCELLED";
  payment_method: "UPI";
  payment_status: "PAID" | "PENDING";
  payment_id: string | null;
  order_id: string | null;
  held_until: string | null;
  created_at: string;
};

export type BookingInput = {
  courtId: CourtId;
  date: string;
  slotIds: string[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  teamName?: string;
  sportType?: string;
};

/**
 * OnePitch operates in India time.
 *
 * IMPORTANT:
 * Vercel/server environments normally run in UTC,
 * so never depend on the server's local timezone for
 * booking availability calculations.
 */
const BUSINESS_TIMEZONE = "Asia/Kolkata";

/**
 * Get the current date/time specifically in India.
 */
function getIndiaDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/**
 * Convert India date parts to YYYY-MM-DD.
 */
function getIndiaDate() {
  const indiaNow = getIndiaDateTime();

  return `${indiaNow.year}-${String(indiaNow.month).padStart(
    2,
    "0",
  )}-${String(indiaNow.day).padStart(2, "0")}`;
}

function mapBooking(b: DbBooking): BookingRecord {
  return {
    id: b.id,
    bookingRef: b.booking_ref,
    courtId: b.court_id,
    date: b.booking_date,
    slotIds: b.slot_ids,
    startTime: b.start_time,
    endTime: b.end_time,
    durationHours: b.duration_hours,
    priceTotal: b.price_total,
    customerName: b.customer_name,
    customerPhone: b.customer_phone,
    customerEmail: b.customer_email || "",
    teamName: b.team_name || undefined,
    sportType: b.sport_type || undefined,
    status: b.status,
    paymentMethod: "UPI",
    paymentStatus: b.payment_status,
    paymentId: b.payment_id || undefined,
    orderId: b.order_id || undefined,
    heldUntil: b.held_until ? new Date(b.held_until).getTime() : undefined,
    createdAt: new Date(b.created_at).getTime(),
  };
}

function getSlotDetails(courtId: CourtId, slotIds: string[]) {
  const selected = MASTER_SLOTS.filter((slot) =>
    slotIds.includes(slot.id),
  ).sort((a, b) => a.startHour - b.startHour);

  if (selected.length !== slotIds.length) {
    throw new Error("One or more selected slots are invalid.");
  }

  return {
    startTime: selected[0].startTime,
    endTime: selected.at(-1)!.endTime,
    duration: selected.length,
    price: COURTS[courtId].pricePerHour * selected.length,
  };
}

export async function getAvailability(
  courtId: CourtId,
  date: string,
): Promise<CalculatedSlot[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("active_booking_slots", {
    p_booking_date: date,
  });

  if (error) {
    throw error;
  }

  const bookings = (data || []) as Pick<
    DbBooking,
    "court_id" | "slot_ids" | "status" | "held_until" | "team_name"
  >[];

  /**
   * IMPORTANT:
   * Use India time instead of the server's timezone.
   *
   * This makes local development and Vercel production
   * behave the same way.
   */
  const indiaNow = getIndiaDateTime();
  const indiaDate = getIndiaDate();

  const today = indiaDate === date;

  return MASTER_SLOTS.map((slot) => {
    const price = COURTS[courtId].pricePerHour;

    /**
     * SLOT EXPIRY
     *
     * Current behavior:
     *
     * 10:00 - 11:00
     * 10:00 -> AVAILABLE
     * 10:29 -> AVAILABLE
     * 10:30 -> EXPIRED
     * 11:00 -> EXPIRED
     *
     * This preserves your existing 30-minute cutoff logic.
     */
    if (
      today &&
      slot.startHour < 24 &&
      (slot.endHour <= indiaNow.hour ||
        (slot.startHour <= indiaNow.hour && indiaNow.minute >= 30))
    ) {
      return {
        ...slot,
        price,
        status: "EXPIRED" as const,
        conflictReason: "This time slot has already passed for today.",
      };
    }

    /**
     * Check database bookings.
     */
    const conflicts = bookings.filter((b) => b.slot_ids.includes(slot.id));

    /**
     * Full Turf blocks both C1 and C2.
     * C1 blocks C1.
     * C2 blocks C2.
     */
    const blocking = conflicts.find(
      (b) => b.court_id === "F" || courtId === "F" || b.court_id === courtId,
    );

    /**
     * No booking conflict.
     */
    if (!blocking) {
      return {
        ...slot,
        price,
        status: "AVAILABLE" as const,
      };
    }

    /**
     * Existing booking is currently being held
     * during checkout.
     */
    const held = blocking.status === "HELD";

    /**
     * Check whether the booking is for the same court.
     */
    const sameCourt = blocking.court_id === courtId;

    return {
      ...slot,
      price,
      status: (sameCourt
        ? held
          ? "HELD"
          : "BOOKED"
        : "UNAVAILABLE") as CalculatedSlot["status"],

      bookedCourt: blocking.court_id,

      bookedBy: blocking.team_name || "Another customer",

      conflictReason: held
        ? "This slot is currently in checkout."
        : `${
            blocking.court_id === "F" ? "Full Turf" : blocking.court_id
          } is booked.`,
    };
  });
}

export async function holdBooking(input: BookingInput) {
  const details = getSlotDetails(input.courtId, input.slotIds);

  /**
   * Always check the latest availability before creating
   * a booking hold.
   */
  const availability = await getAvailability(input.courtId, input.date);

  if (
    input.slotIds.some(
      (slotId) =>
        availability.find((slot) => slot.id === slotId)?.status !== "AVAILABLE",
    )
  ) {
    return {
      success: false as const,
      error: "Selected slots are no longer available.",
    };
  }

  const { data, error } = await getSupabaseServerClient().rpc("hold_booking", {
    p_court_id: input.courtId,
    p_booking_date: input.date,
    p_slot_ids: input.slotIds,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_customer_email: input.customerEmail || "",
    p_start_time: details.startTime,
    p_end_time: details.endTime,
    p_duration_hours: details.duration,
    p_price_total: details.price,
  });

  if (error) {
    return {
      success: false as const,
      error: "Selected slots are no longer available.",
    };
  }

  return {
    success: true as const,
    holdToken: (data as DbBooking).id,
  };
}

export async function attachOrderToBooking(holdToken: string, orderId: string) {
  const { data, error } = await getSupabaseServerClient().rpc(
    "attach_booking_order",
    {
      p_booking_id: holdToken,
      p_order_id: orderId,
    },
  );

  return !error && data === true;
}

export async function confirmHeldBooking(
  input: BookingInput & {
    holdToken: string;
    orderId?: string;
    paymentId?: string;
    paymentStatus?: "PAID" | "PENDING";
  },
) {
  const details = getSlotDetails(input.courtId, input.slotIds);

  const { data, error } = await getSupabaseServerClient().rpc(
    "confirm_booking",
    {
      p_booking_id: input.holdToken,
      p_order_id: input.orderId || null,
      p_payment_id: input.paymentId || null,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_customer_email: input.customerEmail || "",
      p_team_name: input.teamName || "",
      p_sport_type: input.sportType || "",
      p_payment_status: input.paymentStatus || "PAID",
    },
  );

  if (error) {
    return {
      success: false as const,
      error:
        "This checkout hold is no longer valid. Please select the slots again.",
    };
  }

  const booking = mapBooking(data as DbBooking);

  booking.startTime = details.startTime;
  booking.endTime = details.endTime;
  booking.durationHours = details.duration;
  booking.priceTotal = details.price;

  /**
   * Fire booking-confirmed notifications.
   *
   * Notifications must never control whether the booking
   * itself succeeds.
   */
  await Promise.allSettled([
    sendBookingConfirmationEmails(booking),
    sendBookingWhatsAppNotifications(booking),
  ]);

  return {
    success: true as const,
    booking,
  };
}
