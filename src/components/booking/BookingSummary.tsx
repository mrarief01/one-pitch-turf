"use client";

import React from "react";
import { CourtId, COURTS, CalculatedSlot } from "@/lib/bookingStore";

interface BookingSummaryProps {
  selectedCourt: CourtId;
  selectedDate: string; // YYYY-MM-DD
  selectedSlots: CalculatedSlot[];
  onProceedToReview: () => void;
}

export default function BookingSummary({
  selectedCourt,
  selectedDate,
  selectedSlots,
  onProceedToReview,
}: BookingSummaryProps) {
  const court = COURTS[selectedCourt];
  const hasSelected = selectedSlots.length > 0;

  // Format date display
  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const durationHours = selectedSlots.length;
  const basePrice = court.pricePerHour * durationHours;
  const additionalCharges = 0;
  const totalPrice = basePrice + additionalCharges;

  // Sort slots by start hour for clean time display
  const sortedSlots = [...selectedSlots].sort((a, b) => a.startHour - b.startHour);
  const startTime = sortedSlots[0]?.startTime || "—";
  const endTime = sortedSlots[sortedSlots.length - 1]?.endTime || "—";
  const timeRangeDisplay = hasSelected ? `${startTime} – ${endTime}` : "No slot selected";

  return (
    <div className="booking-summary-card">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Step 4</span>
          <h2 className="step-title">Booking Summary &amp; Total</h2>
        </div>
        <p className="step-desc">
          Review your court, time duration, and proceed to lock your booking.
        </p>
      </div>

      <div className="summary-turf-preview">
        <div className="preview-img-container">
          <img src="/images/turf-top-view.jpg" alt="Turf preview" />
          <div className="preview-zone-tag">
            {selectedCourt === "F" ? "FULL GROUND" : selectedCourt}
          </div>
        </div>
        <div className="preview-details">
          <h4>OnePitch Arena — {court.name}</h4>
          <span className="preview-loc">Abiramapuram, Perambalur • {court.capacity}</span>
        </div>
      </div>

      <div className="summary-details-list">
        <div className="summary-row">
          <span className="row-label">Selected Court</span>
          <span className="row-val font-highlight">
            {court.name} <small>({court.subtitle})</small>
          </span>
        </div>

        <div className="summary-row">
          <span className="row-label">Selected Date</span>
          <span className="row-val">{formattedDate}</span>
        </div>

        <div className="summary-row">
          <span className="row-label">Match Time</span>
          <span className="row-val">{timeRangeDisplay}</span>
        </div>

        <div className="summary-row">
          <span className="row-label">Total Duration</span>
          <span className="row-val">
            {hasSelected ? `${durationHours} ${durationHours === 1 ? "Hour" : "Hours"}` : "—"}
          </span>
        </div>

        <div className="summary-divider"></div>

        <div className="summary-row">
          <span className="row-label">Hourly Rate</span>
          <span className="row-val">₹{court.pricePerHour.toLocaleString()} / hr</span>
        </div>

        <div className="summary-row">
          <span className="row-label">Slot Subtotal</span>
          <span className="row-val">₹{basePrice.toLocaleString()}</span>
        </div>

        <div className="summary-row">
          <span className="row-label">Floodlight &amp; Maintenance Fee</span>
          <span className="row-val text-green">FREE (₹0)</span>
        </div>

        <div className="summary-total-row">
          <div className="total-label-box">
            <span className="total-title">Total Payable</span>
            <span className="total-sub">Inc. all amenities &amp; floodlights</span>
          </div>
          <div className="total-amount-box">
            <span className="total-amount">₹{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="summary-action-box">
        <button
          type="button"
          className={`btn btn-primary summary-cta-btn ${!hasSelected ? "btn-disabled" : ""}`}
          disabled={!hasSelected}
          onClick={onProceedToReview}
        >
          {hasSelected ? "Continue to Booking Review →" : "Select an Available Slot Above to Continue"}
        </button>

        <p className="summary-guarantee-note">
          🔒 Real-time slot locking • Zero double-booking guarantee
        </p>
      </div>
    </div>
  );
}
