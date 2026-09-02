"use client";

import React from "react";
import { CourtId, COURTS } from "@/lib/bookingStore";

interface CourtSelectorProps {
  selectedCourt: CourtId;
  onSelectCourt: (court: CourtId) => void;
  availableCounts?: Record<CourtId, number>;
}

export default function CourtSelector({
  selectedCourt,
  onSelectCourt,
  availableCounts,
}: CourtSelectorProps) {
  const courtList: CourtId[] = ["C1", "C2", "F"];

  return (
    <div className="court-selector-section">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2 className="step-title">Choose Court / Turf Area</h2>
        </div>
        <p className="step-desc">
          Select individual court halves (C1/C2) or the entire full ground (F).
        </p>
      </div>

      <div className="court-cards-grid">
        {courtList.map((courtId) => {
          const court = COURTS[courtId];
          const isSelected = selectedCourt === courtId;
          const count = availableCounts ? availableCounts[courtId] : undefined;

          return (
            <div
              key={courtId}
              className={`court-card ${isSelected ? "selected-court" : ""} ${
                courtId === "F" ? "full-turf-card" : ""
              }`}
              onClick={() => onSelectCourt(courtId)}
              role="button"
              tabIndex={0}
            >
              <div className="court-card-top">
                <div className="court-badge-code">
                  <span>{courtId}</span>
                </div>
                <div className="court-price-box">
                  <span className="currency">₹</span>
                  <span className="amount">{court.pricePerHour.toLocaleString()}</span>
                  <span className="unit">/ hour</span>
                </div>
              </div>

              <div className="court-card-body">
                <h3 className="court-name">{court.name}</h3>
                <span className="court-subtitle">{court.subtitle}</span>
                <p className="court-desc">{court.description}</p>
              </div>

              <div className="court-card-footer">
                <div className="court-specs">
                  <span className="spec-tag">{court.capacity}</span>
                </div>

                <div className="select-action-indicator">
                  {isSelected ? (
                    <span className="selected-indicator">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      SELECTED
                    </span>
                  ) : (
                    <span className="select-prompt">Select {courtId} →</span>
                  )}
                </div>
              </div>

              {courtId === "F" && (
                <div className="full-turf-corner-ribbon">
                  <span>DUAL HALF</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
