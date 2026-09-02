"use client";

import React from "react";
import { CourtId } from "@/lib/bookingStore";

interface TurfVisualizerProps {
  selectedCourt: CourtId;
  onSelectCourt: (court: CourtId) => void;
  availabilityStats?: {
    C1?: { available: number; total: number };
    C2?: { available: number; total: number };
    F?: { available: number; total: number };
  };
}

export default function TurfVisualizer({
  selectedCourt,
  onSelectCourt,
  availabilityStats,
}: TurfVisualizerProps) {
  const isC1 = selectedCourt === "C1";
  const isC2 = selectedCourt === "C2";
  const isFull = selectedCourt === "F";

  return (
    <div className="turf-visualizer-card">
      <div className="turf-visualizer-header">
        <div>
          <span className="eyebrow">Interactive Pitch Map</span>
          <h3 className="turf-title">Ground Layout &amp; Zone Selection</h3>
        </div>
        <div className="turf-tag-badge">
          {isFull ? (
            <span className="badge-full">⚡ FULL TURF SELECTED (C1 + C2)</span>
          ) : isC1 ? (
            <span className="badge-c1">📍 COURT 1 (LEFT HALF)</span>
          ) : (
            <span className="badge-c2">📍 COURT 2 (RIGHT HALF)</span>
          )}
        </div>
      </div>

      <div className="turf-stage-container">
        {/* Main Turf Image */}
        <div className="turf-image-wrapper">
          <img
            src="/images/turf-top-view.jpg"
            alt="OnePitch Football Turf Aerial View"
            className="turf-bg-image"
          />

          {/* Interactive Overlay Zones */}
          <div className="turf-overlay-grid">
            {/* Left Half: Court 1 (C1) */}
            <div
              className={`turf-half-zone left-zone ${
                isC1 || isFull ? "active-zone" : ""
              } ${isFull ? "full-active" : ""}`}
              onClick={() => onSelectCourt(isFull ? "C1" : "C1")}
              role="button"
              tabIndex={0}
              aria-label="Select Court 1 (Left Half)"
            >
              <div className="zone-glow-border"></div>
              <div className="zone-info-card left-card">
                <div className="zone-chip">
                  <span className="chip-code">C1</span>
                  <span className="chip-name">Court 1</span>
                </div>
                <p className="zone-spec">Left Half • 5v5 / Cricket</p>
                <div className="zone-price-tag">₹800/hr</div>
              </div>

              {isC1 && (
                <div className="zone-active-pill">
                  <span className="dot pulse"></span> ACTIVE SELECTION
                </div>
              )}
            </div>

            {/* Center Dividing Line Marker */}
            <div className="turf-center-divider">
              <div className="divider-line"></div>
              <div className="divider-badge" title="Center Dividing Boundary">
                <span>DIVIDER</span>
              </div>
            </div>

            {/* Right Half: Court 2 (C2) */}
            <div
              className={`turf-half-zone right-zone ${
                isC2 || isFull ? "active-zone" : ""
              } ${isFull ? "full-active" : ""}`}
              onClick={() => onSelectCourt(isFull ? "C2" : "C2")}
              role="button"
              tabIndex={0}
              aria-label="Select Court 2 (Right Half)"
            >
              <div className="zone-glow-border"></div>
              <div className="zone-info-card right-card">
                <div className="zone-chip">
                  <span className="chip-code">C2</span>
                  <span className="chip-name">Court 2</span>
                </div>
                <p className="zone-spec">Right Half • 5v5 / Cricket</p>
                <div className="zone-price-tag">₹800/hr</div>
              </div>

              {isC2 && (
                <div className="zone-active-pill">
                  <span className="dot pulse"></span> ACTIVE SELECTION
                </div>
              )}
            </div>
          </div>

          {/* Full Turf Unified Overlay Banner when F is selected */}
          {isFull && (
            <div className="full-turf-overlay-banner">
              <div className="full-banner-content">
                <div className="full-turf-icon">🏆</div>
                <div>
                  <h4>FULL TURF — ENTIRE 12,000 SQ FT PITCH</h4>
                  <p>Includes Court 1 + Court 2 simultaneously for 8v8 / 11v11 / Tournaments</p>
                </div>
                <div className="full-banner-price">₹1,500 / hr</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Visualizer Footbar */}
      <div className="turf-visualizer-footer">
        <div className="spec-indicator">
          <span className="spec-dot green"></span>
          <span>FIFA Quality Pro Synthetic Surface</span>
        </div>
        <div className="spec-indicator">
          <span className="spec-dot amber"></span>
          <span>High-Mast LED Floodlighting 24/7</span>
        </div>
        <div className="quick-toggle-group">
          <span className="toggle-label">Direct Pitch Switch:</span>
          <button
            type="button"
            className={`switch-btn ${isC1 ? "selected" : ""}`}
            onClick={() => onSelectCourt("C1")}
          >
            Court 1 (C1)
          </button>
          <button
            type="button"
            className={`switch-btn ${isC2 ? "selected" : ""}`}
            onClick={() => onSelectCourt("C2")}
          >
            Court 2 (C2)
          </button>
          <button
            type="button"
            className={`switch-btn full-btn ${isFull ? "selected" : ""}`}
            onClick={() => onSelectCourt("F")}
          >
            Full Turf (F)
          </button>
        </div>
      </div>
    </div>
  );
}
