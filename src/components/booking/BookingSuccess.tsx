"use client";

import React from "react";
import { BookingRecord, COURTS } from "@/lib/bookingStore";
import Link from "next/link";

interface BookingSuccessProps {
  booking: BookingRecord;
  onBookAnother: () => void;
}

export default function BookingSuccess({ booking, onBookAnother }: BookingSuccessProps) {
  const court = COURTS[booking.courtId];

  // Date formatting
  const dateObj = new Date(booking.date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const whatsappMessage = encodeURIComponent(
    `🏏 *OnePitch Turf Booking Confirmed!* ⚽\n` +
      `📌 *Booking ID:* ${booking.bookingRef}\n` +
      `🏟️ *Court:* ${court.name} (${court.subtitle})\n` +
      `📅 *Date:* ${formattedDate}\n` +
      `⏰ *Time:* ${booking.startTime} - ${booking.endTime} (${booking.durationHours} hrs)\n` +
      `💰 *Amount:* ₹${booking.priceTotal}\n` +
      `👤 *Player:* ${booking.customerName}\n` +
      `📍 *Location:* Collector Office Road, Perambalur`
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="success-screen-wrapper">
      <div className="success-card">
        {/* Celebration Header */}
        <div className="success-badge-icon">
          <div className="icon-circle">✓</div>
        </div>

        <span className="eyebrow success-eyebrow">Match Scheduled</span>
        <h2 className="success-title">BOOKING CONFIRMED</h2>
        <p className="success-subtitle">
          Your slot has been successfully reserved on the pitch. A confirmation message is ready.
        </p>

        {/* Booking Reference Box */}
        <div className="booking-ref-box">
          <span className="ref-label">BOOKING ID</span>
          <span className="ref-number">{booking.bookingRef}</span>
          <span className="status-confirmed-pill">CONFIRMED</span>
        </div>

        {/* Receipt Details Card */}
        <div className="receipt-details-grid">
          <div className="receipt-item">
            <span className="receipt-label">Turf Facility</span>
            <span className="receipt-val">OnePitch Turf, Perambalur</span>
          </div>

          <div className="receipt-item">
            <span className="receipt-label">Court Reserved</span>
            <span className="receipt-val highlight-gold">
              {court.name} — {court.subtitle}
            </span>
          </div>

          <div className="receipt-item">
            <span className="receipt-label">Date</span>
            <span className="receipt-val">{formattedDate}</span>
          </div>

          <div className="receipt-item">
            <span className="receipt-label">Time Slot</span>
            <span className="receipt-val">
              {booking.startTime} – {booking.endTime}
            </span>
          </div>

          <div className="receipt-item">
            <span className="receipt-label">Match Duration</span>
            <span className="receipt-val">
              {booking.durationHours} {booking.durationHours === 1 ? "Hour" : "Hours"}
            </span>
          </div>

          <div className="receipt-item">
            <span className="receipt-label">Player / Contact</span>
            <span className="receipt-val">
              {booking.customerName} ({booking.customerPhone})
            </span>
          </div>

          {booking.teamName && (
            <div className="receipt-item">
              <span className="receipt-label">Team / Club</span>
              <span className="receipt-val">{booking.teamName}</span>
            </div>
          )}

          <div className="receipt-item total-paid-item">
            <span className="receipt-label">Total Amount</span>
            <span className="receipt-val total-price">₹{booking.priceTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions-row">
          <a
            href={`https://wa.me/919952323211?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary whatsapp-btn"
          >
            <span>📱 Share on WhatsApp</span>
          </a>

          <button type="button" className="btn btn-ghost print-btn" onClick={handlePrint}>
            <span>🖨️ Print Receipt</span>
          </button>

          <button type="button" className="btn btn-ghost" onClick={onBookAnother}>
            <span>Book Another Slot</span>
          </button>

          <Link href="/" className="btn btn-ghost back-home-btn">
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Venue Rules Reminder */}
        <div className="venue-guidelines-box">
          <h5>⚡ Venue Guidelines &amp; Reminders:</h5>
          <ul>
            <li>Please arrive 10 minutes prior to your scheduled kickoff time.</li>
            <li>Rubber studs / turf shoes recommended. Metal studs strictly prohibited.</li>
            <li>Complimentary warm-up zone and locker rooms available on site.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
