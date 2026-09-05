export type CourtId = "C1" | "C2" | "F";

export interface CourtInfo {
  id: CourtId;
  name: string;
  subtitle: string;
  description: string;
  pricePerHour: number;
  capacity: string;
  sportTypes: string[];
}

export const COURTS: Record<CourtId, CourtInfo> = {
  C1: {
    id: "C1",
    name: "Court 1",
    subtitle: "Left Half",
    description: "Perfect for 5v5 or 6v6. Pick your Sports football or cricket.",
    pricePerHour: 800,
    capacity: "5v5 / 6v6 (10-12 Players)",
    sportTypes: ["Football", "Cricket"],
  },
  C2: {
    id: "C2",
    name: "Court 2",
    subtitle: "Right Half",
    description: "5v5 or 6v6, floodlit and ready. Bring the whole squad.",
    pricePerHour: 800,
    capacity: "5v5 / 6v6 (10-12 Players)",
    sportTypes: ["Football", "Cricket"],
  },
  F: {
    id: "F",
    name: "Full Turf",
    subtitle: "Entire Turf (C1 + C2)",
    description:
      "Go big with 8v8 or 11v11. Take over the full turf.",
    pricePerHour: 1500,
    capacity: "8v8 / 11v11 (16-22 Players)",
    sportTypes: ["Football", "Cricket"],
  },
};

export type SlotPeriod = "morning" | "afternoon" | "evening" | "night";

export type SlotStatus =
  | "AVAILABLE"
  | "SELECTED"
  | "BOOKED"
  | "EXPIRED"
  | "UNAVAILABLE"
  | "HELD";

export interface SlotDefinition {
  id: string;
  startTime: string;
  endTime: string;
  startHour: number; // 24-hr format (0-23)
  endHour: number;
  period: SlotPeriod;
  label: string;
}

export interface CalculatedSlot extends SlotDefinition {
  status: SlotStatus;
  price: number;
  bookedCourt?: CourtId;
  conflictReason?: string;
  bookedBy?: string;
}

export interface BookingRecord {
  id: string;
  bookingRef: string;
  courtId: CourtId;
  date: string; // YYYY-MM-DD
  slotIds: string[];
  startTime: string;
  endTime: string;
  durationHours: number;
  priceTotal: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  teamName?: string;
  sportType?: string;
  status: "CONFIRMED" | "HELD" | "CANCELLED";
  paymentMethod: "UPI";
  paymentStatus: "PAID" | "PENDING";
  paymentId?: string;
  orderId?: string;
  heldUntil?: number; // timestamp
  createdAt: number;
}

// Master template of 20 hourly slots (05:00 AM to 01:00 AM)
export const MASTER_SLOTS: SlotDefinition[] = [
  // Morning
  { id: "slot-05-06", startTime: "05:00 AM", endTime: "06:00 AM", startHour: 5, endHour: 6, period: "morning", label: "05:00 AM – 06:00 AM" },
  { id: "slot-06-07", startTime: "06:00 AM", endTime: "07:00 AM", startHour: 6, endHour: 7, period: "morning", label: "06:00 AM – 07:00 AM" },
  { id: "slot-07-08", startTime: "07:00 AM", endTime: "08:00 AM", startHour: 7, endHour: 8, period: "morning", label: "07:00 AM – 08:00 AM" },
  { id: "slot-08-09", startTime: "08:00 AM", endTime: "09:00 AM", startHour: 8, endHour: 9, period: "morning", label: "08:00 AM – 09:00 AM" },
  { id: "slot-09-10", startTime: "09:00 AM", endTime: "10:00 AM", startHour: 9, endHour: 10, period: "morning", label: "09:00 AM – 10:00 AM" },
  { id: "slot-10-11", startTime: "10:00 AM", endTime: "11:00 AM", startHour: 10, endHour: 11, period: "morning", label: "10:00 AM – 11:00 AM" },

  // Afternoon
  { id: "slot-11-12", startTime: "11:00 AM", endTime: "12:00 PM", startHour: 11, endHour: 12, period: "afternoon", label: "11:00 AM – 12:00 PM" },
  { id: "slot-12-13", startTime: "12:00 PM", endTime: "01:00 PM", startHour: 12, endHour: 13, period: "afternoon", label: "12:00 PM – 01:00 PM" },
  { id: "slot-13-14", startTime: "01:00 PM", endTime: "02:00 PM", startHour: 13, endHour: 14, period: "afternoon", label: "01:00 PM – 02:00 PM" },
  { id: "slot-14-15", startTime: "02:00 PM", endTime: "03:00 PM", startHour: 14, endHour: 15, period: "afternoon", label: "02:00 PM – 03:00 PM" },
  { id: "slot-15-16", startTime: "03:00 PM", endTime: "04:00 PM", startHour: 15, endHour: 16, period: "afternoon", label: "03:00 PM – 04:00 PM" },

  // Evening
  { id: "slot-16-17", startTime: "04:00 PM", endTime: "05:00 PM", startHour: 16, endHour: 17, period: "evening", label: "04:00 PM – 05:00 PM" },
  { id: "slot-17-18", startTime: "05:00 PM", endTime: "06:00 PM", startHour: 17, endHour: 18, period: "evening", label: "05:00 PM – 06:00 PM" },
  { id: "slot-18-19", startTime: "06:00 PM", endTime: "07:00 PM", startHour: 18, endHour: 19, period: "evening", label: "06:00 PM – 07:00 PM" },
  { id: "slot-19-20", startTime: "07:00 PM", endTime: "08:00 PM", startHour: 19, endHour: 20, period: "evening", label: "07:00 PM – 08:00 PM" },
  { id: "slot-20-21", startTime: "08:00 PM", endTime: "09:00 PM", startHour: 20, endHour: 21, period: "evening", label: "08:00 PM – 09:00 PM" },

  // Night Floodlit
  { id: "slot-21-22", startTime: "09:00 PM", endTime: "10:00 PM", startHour: 21, endHour: 22, period: "night", label: "09:00 PM – 10:00 PM" },
  { id: "slot-22-23", startTime: "10:00 PM", endTime: "11:00 PM", startHour: 22, endHour: 23, period: "night", label: "10:00 PM – 11:00 PM" },
  { id: "slot-23-24", startTime: "11:00 PM", endTime: "12:00 AM", startHour: 23, endHour: 24, period: "night", label: "11:00 PM – 12:00 AM" },
  { id: "slot-00-01", startTime: "12:00 AM", endTime: "01:00 AM", startHour: 24, endHour: 25, period: "night", label: "12:00 AM – 01:00 AM" },
];

// Helper to format date in YYYY-MM-DD
export function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// In-Memory Global Store (Persisted across hot reloads in globalThis)
interface BookingStoreData {
  bookings: BookingRecord[];
}

const globalForBookings = globalThis as unknown as {
  __bookingStore?: BookingStoreData;
};

function getSeedBookings(): BookingRecord[] {
  const today = new Date();
  const dateStr = formatISODate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatISODate(tomorrow);

  return [
    // Today sample bookings for demonstration of conflicts:
    // C1 is booked at 6:00 PM - 7:00 PM (Makes Full Turf unavailable at 6 PM, but C2 available)
    {
      id: "seed-1",
      bookingRef: "TRF-71024",
      courtId: "C1",
      date: dateStr,
      slotIds: ["slot-18-19"],
      startTime: "06:00 PM",
      endTime: "07:00 PM",
      durationHours: 1,
      priceTotal: 800,
      customerName: "Karthik Raja",
      customerPhone: "9876543210",
      customerEmail: "karthik@example.com",
      teamName: "Perambalur Strikers",
      sportType: "Football 5v5",
      status: "CONFIRMED",
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      paymentId: "pay_seed_101",
      createdAt: Date.now() - 3600000,
    },
    // C2 is booked at 7:00 PM - 8:00 PM (Makes Full Turf unavailable at 7 PM, but C1 available)
    {
      id: "seed-2",
      bookingRef: "TRF-71025",
      courtId: "C2",
      date: dateStr,
      slotIds: ["slot-19-20"],
      startTime: "07:00 PM",
      endTime: "08:00 PM",
      durationHours: 1,
      priceTotal: 800,
      customerName: "Vignesh Kumar",
      customerPhone: "9876501234",
      customerEmail: "vignesh@example.com",
      teamName: "Royal CC",
      sportType: "Box Cricket",
      status: "CONFIRMED",
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      paymentId: "pay_seed_102",
      createdAt: Date.now() - 3600000,
    },
    // Full Turf is booked at 8:00 PM - 9:00 PM (Makes C1, C2, and F unavailable)
    {
      id: "seed-3",
      bookingRef: "TRF-71026",
      courtId: "F",
      date: dateStr,
      slotIds: ["slot-20-21"],
      startTime: "08:00 PM",
      endTime: "09:00 PM",
      durationHours: 1,
      priceTotal: 1500,
      customerName: "Mohamed Arshad",
      customerPhone: "9898989898",
      customerEmail: "arshad@example.com",
      teamName: "Thunderbolts FC",
      sportType: "Football 8v8",
      status: "CONFIRMED",
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      paymentId: "pay_seed_103",
      createdAt: Date.now() - 3600000,
    },
    // Tomorrow: Full Turf booked 07:00 PM - 09:00 PM
    {
      id: "seed-4",
      bookingRef: "TRF-82001",
      courtId: "F",
      date: tomorrowStr,
      slotIds: ["slot-19-20", "slot-20-21"],
      startTime: "07:00 PM",
      endTime: "09:00 PM",
      durationHours: 2,
      priceTotal: 3000,
      customerName: "Senthil Nathan",
      customerPhone: "9842112233",
      customerEmail: "senthil@example.com",
      teamName: "District Premier League",
      sportType: "Tournament",
      status: "CONFIRMED",
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      paymentId: "pay_seed_104",
      createdAt: Date.now() - 7200000,
    },
  ];
}

const store: BookingStoreData = globalForBookings.__bookingStore || {
  bookings: getSeedBookings(),
};

if (process.env.NODE_ENV !== "production") {
  globalForBookings.__bookingStore = store;
}

/**
 * Calculates slot availability for a given court and date based on strict multi-resource conflict rules.
 */
export function calculateAvailability(
  requestedCourt: CourtId,
  date: string,
  now: Date = new Date()
): CalculatedSlot[] {
  // Clean up any expired temporary holds
  const nowMs = now.getTime();
  store.bookings = store.bookings.filter((b) => {
    if (b.status === "HELD" && b.heldUntil && b.heldUntil < nowMs) {
      return false; // drop expired hold
    }
    return b.status !== "CANCELLED";
  });

  const isToday = formatISODate(now) === date;
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Filter existing active bookings on this date
  const dateBookings = store.bookings.filter((b) => b.date === date);

  // Map each slot definition to its calculated availability state
  return MASTER_SLOTS.map((def) => {
    const price = COURTS[requestedCourt].pricePerHour;

    // Check if slot has expired for today's date
    if (isToday) {
      const isPast =
        def.endHour <= currentHour ||
        (def.startHour <= currentHour && currentMinutes >= 30);
      if (isPast && def.startHour < 24) {
        return {
          ...def,
          status: "EXPIRED",
          price,
          conflictReason: "This time slot has already passed for today.",
        };
      }
    }

    // Check bookings occupying this slot
    const overlappingBookings = dateBookings.filter((b) =>
      b.slotIds.includes(def.id)
    );

    const fBooking = overlappingBookings.find((b) => b.courtId === "F");
    const c1Booking = overlappingBookings.find((b) => b.courtId === "C1");
    const c2Booking = overlappingBookings.find((b) => b.courtId === "C2");

    // Case 1: Full Turf (F) is booked
    if (fBooking) {
      const isHeld = fBooking.status === "HELD";
      if (requestedCourt === "F") {
        return {
          ...def,
          status: isHeld ? "HELD" : "BOOKED",
          price,
          bookedCourt: "F",
          bookedBy: fBooking.teamName || fBooking.customerName,
          conflictReason: isHeld
            ? "Full turf is currently in checkout process."
            : `Full turf is booked by ${fBooking.teamName || fBooking.customerName}.`,
        };
      } else {
        return {
          ...def,
          status: "UNAVAILABLE",
          price,
          bookedCourt: "F",
          conflictReason: `Full Turf is booked (${fBooking.teamName || "Occupied"}).`,
        };
      }
    }

    // Case 2: User wants Court 1 (C1)
    if (requestedCourt === "C1") {
      if (c1Booking) {
        const isHeld = c1Booking.status === "HELD";
        return {
          ...def,
          status: isHeld ? "HELD" : "BOOKED",
          price,
          bookedCourt: "C1",
          bookedBy: c1Booking.teamName || c1Booking.customerName,
          conflictReason: isHeld
            ? "Court 1 is currently in checkout process."
            : `Court 1 is booked by ${c1Booking.teamName || c1Booking.customerName}.`,
        };
      }
      return {
        ...def,
        status: "AVAILABLE",
        price,
      };
    }

    // Case 3: User wants Court 2 (C2)
    if (requestedCourt === "C2") {
      if (c2Booking) {
        const isHeld = c2Booking.status === "HELD";
        return {
          ...def,
          status: isHeld ? "HELD" : "BOOKED",
          price,
          bookedCourt: "C2",
          bookedBy: c2Booking.teamName || c2Booking.customerName,
          conflictReason: isHeld
            ? "Court 2 is currently in checkout process."
            : `Court 2 is booked by ${c2Booking.teamName || c2Booking.customerName}.`,
        };
      }
      return {
        ...def,
        status: "AVAILABLE",
        price,
      };
    }

    // Case 4: User wants Full Turf (F)
    if (requestedCourt === "F") {
      if (c1Booking && c2Booking) {
        return {
          ...def,
          status: "UNAVAILABLE",
          price,
          conflictReason: `Full turf unavailable: Both Court 1 (${c1Booking.teamName || "Booked"}) and Court 2 (${c2Booking.teamName || "Booked"}) are booked.`,
        };
      }
      if (c1Booking) {
        return {
          ...def,
          status: "UNAVAILABLE",
          price,
          bookedCourt: "C1",
          conflictReason: `Court 1 is booked by ${c1Booking.teamName || c1Booking.customerName}.`,
        };
      }
      if (c2Booking) {
        return {
          ...def,
          status: "UNAVAILABLE",
          price,
          bookedCourt: "C2",
          conflictReason: `Court 2 is booked by ${c2Booking.teamName || c2Booking.customerName}.`,
        };
      }
      return {
        ...def,
        status: "AVAILABLE",
        price,
      };
    }

    return {
      ...def,
      status: "AVAILABLE",
      price,
    };
  });
}

/**
 * Creates a 5-minute temporary hold on slots during checkout.
 */
export function holdSlots(params: {
  courtId: CourtId;
  date: string;
  slotIds: string[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}): { success: boolean; holdToken?: string; error?: string } {
  const availability = calculateAvailability(params.courtId, params.date);

  for (const slotId of params.slotIds) {
    const slot = availability.find((s) => s.id === slotId);
    if (!slot || slot.status !== "AVAILABLE") {
      return {
        success: false,
        error: `Slot ${slot?.label || slotId} is no longer available (${slot?.conflictReason || "conflict"}).`,
      };
    }
  }

  const holdId = `hold-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const heldUntil = Date.now() + 5 * 60 * 1000; // 5 minutes

  const selectedDefs = MASTER_SLOTS.filter((s) => params.slotIds.includes(s.id));
  const startTime = selectedDefs[0]?.startTime || "";
  const endTime = selectedDefs[selectedDefs.length - 1]?.endTime || "";
  const duration = selectedDefs.length;
  const price = COURTS[params.courtId].pricePerHour * duration;

  const newBooking: BookingRecord = {
    id: holdId,
    bookingRef: `HLD-${Math.floor(10000 + Math.random() * 90000)}`,
    courtId: params.courtId,
    date: params.date,
    slotIds: params.slotIds,
    startTime,
    endTime,
    durationHours: duration,
    priceTotal: price,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    status: "HELD",
    paymentMethod: "UPI",
    paymentStatus: "PENDING",
    heldUntil,
    createdAt: Date.now(),
  };

  store.bookings.push(newBooking);

  return {
    success: true,
    holdToken: holdId,
  };
}

/** Associates a Razorpay order with the temporary hold that created it. */
export function attachOrderToHold(holdToken: string, orderId: string): boolean {
  const hold = store.bookings.find((booking) => booking.id === holdToken && booking.status === "HELD");
  if (!hold || !hold.heldUntil || hold.heldUntil <= Date.now()) return false;

  hold.orderId = orderId;
  return true;
}

/**
 * Atomically confirms booking after Razorpay payment verification.
 */
export function confirmBooking(params: {
  holdToken?: string;
  courtId: CourtId;
  date: string;
  slotIds: string[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  teamName?: string;
  sportType?: string;
  paymentMethod?: "UPI";
  paymentStatus?: "PAID" | "PENDING";
  paymentId?: string;
  orderId?: string;
}): { success: boolean; booking?: BookingRecord; error?: string } {
  // If holdToken exists, verify and upgrade that hold
  if (params.holdToken) {
    const existingHoldIndex = store.bookings.findIndex(
      (b) => b.id === params.holdToken && b.status === "HELD"
    );

    if (existingHoldIndex !== -1) {
      const holdRecord = store.bookings[existingHoldIndex];

      if (
        !holdRecord.heldUntil ||
        holdRecord.heldUntil <= Date.now() ||
        (params.orderId !== undefined && holdRecord.orderId !== params.orderId) ||
        holdRecord.courtId !== params.courtId ||
        holdRecord.date !== params.date ||
        holdRecord.slotIds.length !== params.slotIds.length ||
        !holdRecord.slotIds.every((slotId) => params.slotIds.includes(slotId))
      ) {
        return { success: false, error: "This checkout hold is no longer valid. Please select the slots again." };
      }
      const bookingRef = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

      const confirmedBooking: BookingRecord = {
        ...holdRecord,
        bookingRef,
        customerName: params.customerName || holdRecord.customerName,
        customerPhone: params.customerPhone || holdRecord.customerPhone,
        customerEmail: params.customerEmail || holdRecord.customerEmail,
        teamName: params.teamName,
        sportType: params.sportType,
        status: "CONFIRMED",
        paymentMethod: params.paymentMethod || "UPI",
        paymentStatus: params.paymentStatus || "PAID",
        paymentId: params.paymentId,
        orderId: params.orderId,
        heldUntil: undefined,
      };

      store.bookings[existingHoldIndex] = confirmedBooking;

      return {
        success: true,
        booking: confirmedBooking,
      };
    }
  }

  // Direct confirmation with atomic availability verification
  const availability = calculateAvailability(params.courtId, params.date);

  for (const slotId of params.slotIds) {
    const slot = availability.find((s) => s.id === slotId);
    if (!slot || slot.status !== "AVAILABLE") {
      return {
        success: false,
        error: `Sorry! Slot ${slot?.label || slotId} was just booked by another player (${slot?.conflictReason || "Conflict"}).`,
      };
    }
  }

  const selectedDefs = MASTER_SLOTS.filter((s) => params.slotIds.includes(s.id));
  const startTime = selectedDefs[0]?.startTime || "";
  const endTime = selectedDefs[selectedDefs.length - 1]?.endTime || "";
  const duration = selectedDefs.length;
  const price = COURTS[params.courtId].pricePerHour * duration;
  const bookingRef = `TRF-${Math.floor(100000 + Math.random() * 900000)}`;

  const newBooking: BookingRecord = {
    id: `book-${Date.now()}`,
    bookingRef,
    courtId: params.courtId,
    date: params.date,
    slotIds: params.slotIds,
    startTime,
    endTime,
    durationHours: duration,
    priceTotal: price,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    teamName: params.teamName,
    sportType: params.sportType,
    status: "CONFIRMED",
    paymentMethod: params.paymentMethod || "UPI",
    paymentStatus: params.paymentStatus || "PAID",
    paymentId: params.paymentId,
    orderId: params.orderId,
    createdAt: Date.now(),
  };

  store.bookings.push(newBooking);

  return {
    success: true,
    booking: newBooking,
  };
}

/**
 * Get all existing bookings (for testing / simulation)
 */
export function getAllBookings(): BookingRecord[] {
  return store.bookings.filter((b) => b.status === "CONFIRMED");
}

/**
 * Reset or seed bookings
 */
export function resetBookings() {
  store.bookings = getSeedBookings();
}
