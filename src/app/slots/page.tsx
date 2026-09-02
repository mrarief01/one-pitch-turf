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
import ConflictSimulator from "@/components/booking/ConflictSimulator";
import { CourtId, CalculatedSlot, BookingRecord, formatISODate } from "@/lib/bookingStore";
import { useReveal } from "@/hooks/useReveal";

export default function BookingPage() {
  useReveal();

  const [selectedCourt, setSelectedCourt] = useState<CourtId>("C1");
  const [selectedDate, setSelectedDate] = useState<string>(() => formatISODate(new Date()));
  const [slots, setSlots] = useState<CalculatedSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  // Fetch real-time availability from backend API
  const fetchAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/availability?court=${selectedCourt}&date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        // Prune any selected slots that are no longer available in the new query
        setSelectedSlotIds((prev) =>
          prev.filter((id) => {
            const match = data.slots.find((s: CalculatedSlot) => s.id === id);
            return match && match.status === "AVAILABLE";
          })
        );
      }
    } catch (err) {
      console.error("Failed to load availability:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourt, selectedDate]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Handle slot selection (Supports single or consecutive slot selection)
  const handleToggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      } else {
        const clickedSlot = slots.find((s) => s.id === slotId);
        if (!clickedSlot || clickedSlot.status !== "AVAILABLE") return prev;

        if (prev.length === 0) {
          return [slotId];
        }

        // Check if contiguous with currently selected slots
        const currentlySelected = slots
          .filter((s) => prev.includes(s.id))
          .sort((a, b) => a.startHour - b.startHour);

        const minHour = currentlySelected[0].startHour;
        const maxHour = currentlySelected[currentlySelected.length - 1].endHour;

        if (clickedSlot.endHour === minHour || clickedSlot.startHour === maxHour) {
          return [...prev, slotId];
        } else {
          // Replace with clicked slot
          return [slotId];
        }
      }
    });
  };

  const handleCourtChange = (court: CourtId) => {
    setSelectedCourt(court);
    setSelectedSlotIds([]); // reset selection on court switch
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotIds([]); // reset selection on date switch
  };

  const handleBookingSuccess = (booking: BookingRecord) => {
    setIsReviewOpen(false);
    setConfirmedBooking(booking);
    fetchAvailability();
  };

  const handleBookAnother = () => {
    setConfirmedBooking(null);
    setSelectedSlotIds([]);
    fetchAvailability();
  };

  const handleAvailabilityConflict = (msg: string) => {
    setConflictAlert(msg);
    fetchAvailability();
    setTimeout(() => setConflictAlert(null), 6000);
  };

  const selectedSlotObjects = slots.filter((s) => selectedSlotIds.includes(s.id));

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
            <p className="booking-lead-text">
              Follow the simple step-by-step flow below to view pitch zones, select your date, pick live available slots, and confirm your match.
            </p>
          </div>

          {/* Conflict Engine Testing & Rule Bar */}
          <div className="reveal">
            <ConflictSimulator
              onRefreshAvailability={fetchAvailability}
              currentCourt={selectedCourt}
            />
          </div>

          {conflictAlert && (
            <div className="global-conflict-toast reveal">
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

              {/* 2. Step 1: Court Selection */}
              <div className="reveal flow-step-card">
                <CourtSelector
                  selectedCourt={selectedCourt}
                  onSelectCourt={handleCourtChange}
                />
              </div>

              {/* 3. Step 2: Select Booking Date (1 Week alone) */}
              <div className="reveal flow-step-card">
                <DateSelector
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                  daysCount={7}
                />
              </div>

              {/* 4. Step 3: Select Available Time Slot */}
              <div className="reveal flow-step-card">
                <TimeSlotGrid
                  slots={slots}
                  selectedSlotIds={selectedSlotIds}
                  onToggleSlot={handleToggleSlot}
                  isLoading={isLoading}
                />
              </div>

              {/* 5. Step 4: Booking Summary & Total */}
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
