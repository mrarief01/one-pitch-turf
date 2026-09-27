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
import BookingBreadcrumb, { BookingStep } from "@/components/booking/BookingBreadcrumb";
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

  // ── Booking data state ──────────────────────────────────────────────────────
  const [selectedCourt, setSelectedCourt] = useState<CourtId>("C1");

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatISODate(new Date()),
  );

  const [slots, setSlots] = useState<CalculatedSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [confirmedBooking, setConfirmedBooking] =
    useState<BookingRecord | null>(null);

  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  // ── Multi-step navigation state ─────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<BookingStep>(1);

  // Push a history entry so browser Back navigates between steps
  const pushStepHistory = useCallback((step: BookingStep) => {
    window.history.pushState({ bookingStep: step }, "");
  }, []);

  // Navigate to a step (forward or backward breadcrumb click)
  const goToStep = useCallback(
    (step: BookingStep, pushHistory = true) => {
      setCurrentStep(step);
      if (step > maxReachedStep) {
        setMaxReachedStep(step);
      }
      if (pushHistory) {
        pushStepHistory(step);
      }
      // Scroll to top of booking content area on step change
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [maxReachedStep, pushStepHistory],
  );

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { bookingStep?: BookingStep } | null;
      if (state?.bookingStep) {
        // Navigate without pushing another history entry
        setCurrentStep(state.bookingStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    // Push initial state so Back from Step 1 exits the page correctly
    window.history.replaceState({ bookingStep: 1 }, "");

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
   * Keep availability synchronized while the booking page
   * remains open.
   *
   * This is required because time passing does not create
   * a Supabase realtime event.
   *
   * Example:
   *
   * 1:00 PM - 2:00 PM
   *
   * At 1:59 PM → slot is visible
   * At 2:00 PM → refresh availability
   *              → backend marks it EXPIRED
   *              → TimeSlotGrid removes it
   */
  useEffect(() => {
    const availabilityRefreshInterval = window.setInterval(() => {
      fetchAvailability(true);
    }, 60_000);

    return () => {
      window.clearInterval(availabilityRefreshInterval);
    };
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
   * If the user is going back to Step 1 and changes court,
   * clear slot selections and reset progress so they must re-pick in Step 2.
   */
  const handleCourtChange = (court: CourtId) => {
    if (court !== selectedCourt) {
      setSelectedCourt(court);
      setSelectedSlotIds([]);
      // Reset maxReachedStep so Step 2 & 3 breadcrumbs become non-clickable
      // until the user has re-selected a slot
      setMaxReachedStep(1);
    }
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
    setCurrentStep(1);
    setMaxReachedStep(1);
    window.history.replaceState({ bookingStep: 1 }, "");

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

  const hasSlotSelected = selectedSlotIds.length > 0;

  // ── Step Continue handler ───────────────────────────────────────────────────
  const handleContinue = () => {
    const next = (currentStep + 1) as BookingStep;
    if (next > 3) return;
    goToStep(next);
  };

  // ── Breadcrumb step click ───────────────────────────────────────────────────
  const handleStepClick = (step: BookingStep) => {
    if (step <= maxReachedStep && step !== currentStep) {
      goToStep(step);
    }
  };

  return (
    <>
      <Header />

      <main className="booking-page-main">
        <div className="wrap booking-container-wrap">
          {/* Booking Page Hero Banner */}
          <div className="booking-page-header reveal">
            <h5 className="booking-main-title">
              RESERVE YOUR <em>MATCH SLOT</em>
            </h5>
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
            <>
              {/* ── Breadcrumb navigation ── */}
              <BookingBreadcrumb
                currentStep={currentStep}
                maxReachedStep={maxReachedStep}
                onStepClick={handleStepClick}
              />

              {/* ── Step screens ── */}
              <div className="booking-step-screen">
                {/* STEP 1: Select Zone */}
                {currentStep === 1 && (
                  <div className="step-content">
                    <div className="step-section-label">
                      {/* <h2 className="step-screen-title">Select Your Zone</h2> */}
                      <p className="step-screen-desc">
                        Choose a court from the interactive pitch map below,
                        then continue.
                      </p>
                    </div>

                    <div className="flow-step-card">
                      <TurfVisualizer
                        selectedCourt={selectedCourt}
                        onSelectCourt={handleCourtChange}
                      />
                    </div>

                    <div className="flow-step-card">
                      <CourtSelector
                        selectedCourt={selectedCourt}
                        onSelectCourt={handleCourtChange}
                      />
                    </div>

                    <div className="step-footer">
                      <div className="step-footer-right">
                        <button
                          type="button"
                          className="btn btn-primary step-continue-btn"
                          onClick={handleContinue}
                        >
                          Continue to Booking Details →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Booking Details */}
                {currentStep === 2 && (
                  <div className="step-content">
                    <div className="step-section-label">
                      {/* <span className="eyebrow">Step 2 of 3</span> */}
                      {/* <h2 className="step-screen-title">Booking Details</h2> */}
                      <p className="step-screen-desc">
                        Pick a date and select your preferred time slot(s).
                      </p>
                    </div>

                    <div className="flow-step-card">
                      <DateSelector
                        selectedDate={selectedDate}
                        onSelectDate={handleDateChange}
                        daysCount={7}
                      />
                    </div>

                    <div className="flow-step-card">
                      <TimeSlotGrid
                        slots={slots}
                        selectedSlotIds={selectedSlotIds}
                        onToggleSlot={handleToggleSlot}
                        isLoading={isLoading}
                      />
                    </div>

                    <div className="step-footer">
                      <button
                        type="button"
                        className="btn btn-ghost step-back-btn"
                        onClick={() => goToStep(1)}
                      >
                        ← Back to Zone
                      </button>
                      <div className="step-footer-right">
                        {!hasSlotSelected && (
                          <span className="step-hint-text">
                            Select at least one slot to continue
                          </span>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary step-continue-btn"
                          onClick={handleContinue}
                          disabled={!hasSlotSelected}
                        >
                          Continue to Review →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review & Pay */}
                {currentStep === 3 && (
                  <div className="step-content">
                    <div className="step-section-label">
                      {/* <span className="eyebrow">Step 3 of 3</span> */}
                      {/* <h2 className="step-screen-title">Review &amp; Pay</h2> */}
                      <p className="step-screen-desc">
                        Review your booking summary, enter your details, and
                        complete payment.
                      </p>
                    </div>

                    {/* Read-only booking summary */}
                    <div className="flow-step-card">
                      <BookingSummary
                        selectedCourt={selectedCourt}
                        selectedDate={selectedDate}
                        selectedSlots={selectedSlotObjects}
                        onProceedToReview={() => {
                          /* no-op: we're already on Step 3 */
                        }}
                      />
                    </div>

                    {/* Inline checkout form (no modal backdrop) */}
                    <div className="flow-step-card">
                      <div className="inline-checkout-card">
                        <div className="inline-checkout-header">
                          <span className="eyebrow">
                            Checkout &amp; Verification
                          </span>
                          <h3 className="inline-checkout-title">
                            Player Details &amp; Payment
                          </h3>
                        </div>

                        <BookingModal
                          isOpen={true}
                          inlineMode={true}
                          onClose={() => goToStep(2)}
                          selectedCourt={selectedCourt}
                          selectedDate={selectedDate}
                          selectedSlots={selectedSlotObjects}
                          onBookingSuccess={handleBookingSuccess}
                          onAvailabilityConflict={handleAvailabilityConflict}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
