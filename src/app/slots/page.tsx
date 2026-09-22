"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TurfVisualizer from "@/components/booking/TurfVisualizer";
import CourtSelector from "@/components/booking/CourtSelector";
import DateSelector from "@/components/booking/DateSelector";
import TimeSlotGrid from "@/components/booking/TimeSlotGrid";
import BookingSummary from "@/components/booking/BookingSummary";
import BookingModal from "@/components/booking/BookingModal";
import BookingSuccess from "@/components/booking/BookingSuccess";
import {
  CourtId,
  CalculatedSlot,
  BookingRecord,
  formatISODate,
} from "@/lib/bookingStore";
import { useReveal } from "@/hooks/useReveal";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function BookingPage() {
  useReveal();

  const [selectedCourt, setSelectedCourt] = useState<CourtId>("C1");

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatISODate(new Date()),
  );

  const [slots, setSlots] = useState<CalculatedSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  const [confirmedBooking, setConfirmedBooking] =
    useState<BookingRecord | null>(null);

  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  /**
   * Fetch authoritative availability from our backend API.
   *
   * silent = false:
   * Shows loading state.
   *
   * silent = true:
   * Refreshes availability in the background without
   * making the slot grid flash into a loading state.
   */
  const fetchAvailability = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }

      try {
        const res = await fetch(
          `/api/availability?court=${selectedCourt}&date=${selectedDate}`,
          {
            cache: "no-store",
          },
        );

        if (!res.ok) {
          throw new Error(`Availability API returned ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          setAvailabilityError(null);

          const latestSlots: CalculatedSlot[] = data.slots || [];

          setSlots(latestSlots);

          /**
           * If another customer booked a slot while this user
           * was looking at the page, remove that slot from
           * the user's current selection.
           */
          setSelectedSlotIds((prev) =>
            prev.filter((id) => {
              const match = latestSlots.find((slot) => slot.id === id);

              return match && match.status === "AVAILABLE";
            }),
          );
        } else {
          setAvailabilityError(
            data.error || "Unable to load live availability.",
          );
        }
      } catch (err) {
        console.error("Failed to load availability:", err);

        setAvailabilityError(
          "Unable to reach the live booking database. Please try again.",
        );
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [selectedCourt, selectedDate],
  );

  /**
   * Initial availability fetch.
   *
   * Runs whenever the selected court or selected date changes.
   */
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  /**
   * Supabase Realtime
   *
   * Whenever the bookings table changes anywhere:
   *
   * Customer A books a slot
   *        ↓
   * Supabase bookings table changes
   *        ↓
   * Realtime event
   *        ↓
   * Customer B receives event
   *        ↓
   * Customer B fetches latest availability
   *        ↓
   * Slot UI updates
   */
  useEffect(() => {
    console.log("Starting OnePitch realtime connection...");

    const channel = supabaseBrowser
      .channel("onepitch-booking-availability")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          console.log(
            "🔥 OnePitch realtime booking change:",
            payload.eventType,
            payload,
          );

          fetchAvailability(true);
        },
      )
      .subscribe((status) => {
        console.log("OnePitch realtime status:", status);
      });

    return () => {
      console.log("Closing OnePitch realtime connection...");
      supabaseBrowser.removeChannel(channel);
    };
  }, [fetchAvailability]);

  /**
   * Handle slot selection.
   *
   * Supports:
   * - single slot
   * - consecutive slots
   */
  const handleToggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      // Clicking an already-selected slot removes it.
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      }

      const clickedSlot = slots.find((slot) => slot.id === slotId);

      // Do not allow unavailable slots to be selected.
      if (!clickedSlot || clickedSlot.status !== "AVAILABLE") {
        return prev;
      }

      // First selection.
      if (prev.length === 0) {
        return [slotId];
      }

      // Get currently selected slots in chronological order.
      const currentlySelected = slots
        .filter((slot) => prev.includes(slot.id))
        .sort((a, b) => a.startHour - b.startHour);

      const minHour = currentlySelected[0].startHour;

      const maxHour = currentlySelected[currentlySelected.length - 1].endHour;

      /**
       * Only allow the new slot if it directly touches
       * the currently selected range.
       */
      if (
        clickedSlot.endHour === minHour ||
        clickedSlot.startHour === maxHour
      ) {
        return [...prev, slotId];
      }

      // Otherwise start a new selection.
      return [slotId];
    });
  };

  /**
   * Change court.
   */
  const handleCourtChange = (court: CourtId) => {
    setSelectedCourt(court);
    setSelectedSlotIds([]);
  };

  /**
   * Change booking date.
   */
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotIds([]);
  };

  /**
   * Booking completed successfully.
   */
  const handleBookingSuccess = (booking: BookingRecord) => {
    setIsReviewOpen(false);
    setConfirmedBooking(booking);

    // Refresh availability after successful booking.
    fetchAvailability();
  };

  /**
   * Customer wants to make another booking.
   */
  const handleBookAnother = () => {
    setConfirmedBooking(null);
    setSelectedSlotIds([]);

    fetchAvailability();
  };

  /**
   * Another customer already booked the selected slot
   * while this customer was checking out.
   */
  const handleAvailabilityConflict = (msg: string) => {
    setConflictAlert(msg);

    // Immediately refresh availability.
    fetchAvailability();

    setTimeout(() => {
      setConflictAlert(null);
    }, 5000);
  };

  /**
   * Convert selected slot IDs into full slot objects.
   */
  const selectedSlotObjects = slots.filter((slot) =>
    selectedSlotIds.includes(slot.id),
  );

  return (
    <>
      <Header />

      <main className="booking-page-main">
        <div className="wrap booking-container-wrap">
          {/* Booking Page Hero Banner */}
          <div className="booking-page-header reveal">
            <span className="eyebrow">Real-Time Booking Engine</span>

            <h1 className="booking-main-title">
              RESERVE YOUR <em>MATCH SLOT</em>
            </h1>
          </div>

          {/* General availability error */}
          {availabilityError && (
            <div
              className="global-conflict-toast"
              role="alert"
              aria-live="assertive"
            >
              <div className="toast-body">
                <strong>Booking unavailable:</strong> {availabilityError}
              </div>
            </div>
          )}

          {/* Booking conflict notification */}
          {conflictAlert && (
            <div
              className="global-conflict-toast"
              role="alert"
              aria-live="assertive"
            >
              <div className="toast-icon">⚠️</div>

              <div className="toast-body">
                <strong>Availability Notice:</strong> {conflictAlert}
              </div>

              <button
                type="button"
                className="toast-close"
                onClick={() => setConflictAlert(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Booking Content or Success Screen */}
          {confirmedBooking ? (
            <BookingSuccess
              booking={confirmedBooking}
              onBookAnother={handleBookAnother}
            />
          ) : (
            <div className="booking-vertical-flow">
              {/* 1. Interactive Pitch Map */}
              <div className="reveal flow-step-card">
                <TurfVisualizer
                  selectedCourt={selectedCourt}
                  onSelectCourt={handleCourtChange}
                />
              </div>

              {/* 2. Court Selection */}
              <div className="reveal flow-step-card">
                <CourtSelector
                  selectedCourt={selectedCourt}
                  onSelectCourt={handleCourtChange}
                />
              </div>

              {/* 3. Booking Date */}
              <div className="reveal flow-step-card">
                <DateSelector
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                  daysCount={7}
                />
              </div>

              {/* 4. Available Time Slots */}
              <div className="reveal flow-step-card">
                <TimeSlotGrid
                  slots={slots}
                  selectedSlotIds={selectedSlotIds}
                  onToggleSlot={handleToggleSlot}
                  isLoading={isLoading}
                />
              </div>

              {/* 5. Booking Summary */}
              <div className="reveal flow-step-card">
                <BookingSummary
                  selectedCourt={selectedCourt}
                  selectedDate={selectedDate}
                  selectedSlots={selectedSlotObjects}
                  onProceedToReview={() => setIsReviewOpen(true)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Review & Hold Checkout Modal */}
        <BookingModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          selectedCourt={selectedCourt}
          selectedDate={selectedDate}
          selectedSlots={selectedSlotObjects}
          onBookingSuccess={handleBookingSuccess}
          onAvailabilityConflict={handleAvailabilityConflict}
        />
      </main>

      <Footer />
    </>
  );
}
