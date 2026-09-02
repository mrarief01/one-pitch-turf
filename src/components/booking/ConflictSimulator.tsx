"use client";

import React, { useState } from "react";
import { CourtId } from "@/lib/bookingStore";

interface ConflictSimulatorProps {
  onRefreshAvailability: () => void;
  currentCourt: CourtId;
}

export default function ConflictSimulator({
  onRefreshAvailability,
  currentCourt,
}: ConflictSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSimulateBooking = async (courtId: CourtId, slotId: string, teamName: string) => {
    setStatusMsg(`Simulating booking for ${courtId}...`);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          courtId,
          date: today,
          slotIds: [slotId],
          customerName: `${teamName} (Demo)`,
          customerPhone: "9952323211",
          customerEmail: "demo@onepitch.com",
          teamName,
          sportType: "Football",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✓ Successfully booked ${courtId} for slot! Check conflicts.`);
        onRefreshAvailability();
      } else {
        setStatusMsg(`⚠️ Note: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg("Error running simulation.");
    }

    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleReset = async () => {
    setStatusMsg("Resetting demo bookings...");
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      setStatusMsg("✓ Reset to default seed bookings.");
      onRefreshAvailability();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="conflict-simulator-bar">
      <div className="simulator-header-row">
        <div className="sim-title-group">
          <span className="sim-pulse-dot"></span>
          <strong>Multi-Resource Conflict Engine:</strong>
          <span className="sim-rule-pill">C1 ⇄ C2 ⇄ Full Turf (F)</span>
        </div>
        <button
          type="button"
          className="sim-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Hide Conflict Test Panel ▲" : "Test Live Conflict Scenarios ▼"}
        </button>
      </div>

      {isOpen && (
        <div className="simulator-body">
          <p className="sim-explainer">
            <strong>Rule in Action:</strong> When C1 or C2 is booked, Full Turf (F) becomes automatically
            unavailable for that exact slot with clear explanation. When Full Turf is booked, both C1 and C2 are blocked.
          </p>

          <div className="sim-buttons-grid">
            <button
              type="button"
              className="sim-action-btn"
              onClick={() => handleSimulateBooking("C1", "slot-18-19", "Perambalur FC")}
            >
              ⚽ Book C1 at 06:00 PM (Blocks Full Turf, leaves C2 open)
            </button>

            <button
              type="button"
              className="sim-action-btn"
              onClick={() => handleSimulateBooking("C2", "slot-19-20", "Royal CC")}
            >
              🏏 Book C2 at 07:00 PM (Blocks Full Turf, leaves C1 open)
            </button>

            <button
              type="button"
              className="sim-action-btn full-sim-btn"
              onClick={() => handleSimulateBooking("F", "slot-20-21", "Thunder League")}
            >
              🏆 Book Full Turf (F) at 08:00 PM (Blocks C1, C2 &amp; F)
            </button>

            <button type="button" className="sim-reset-btn" onClick={handleReset}>
              🔄 Reset Demo Bookings
            </button>
          </div>

          {statusMsg && <div className="sim-status-message">{statusMsg}</div>}
        </div>
      )}
    </div>
  );
}
