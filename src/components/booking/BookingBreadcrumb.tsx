"use client";

import React from "react";

export type BookingStep = 1 | 2 | 3;

interface BreadcrumbStepConfig {
  step: BookingStep;
  label: string;
  shortLabel: string;
  icon: string;
}

const STEPS: BreadcrumbStepConfig[] = [
  { step: 1, label: "Select Zone", shortLabel: "Zone", icon: "🏟️" },
  { step: 2, label: "Booking Details", shortLabel: "Details", icon: "📅" },
  { step: 3, label: "Review & Pay", shortLabel: "Pay", icon: "💳" },
];

interface BookingBreadcrumbProps {
  currentStep: BookingStep;
  maxReachedStep: BookingStep;
  onStepClick: (step: BookingStep) => void;
}

export default function BookingBreadcrumb({
  currentStep,
  maxReachedStep,
  onStepClick,
}: BookingBreadcrumbProps) {
  return (
    <nav className="booking-breadcrumb" aria-label="Booking steps">
      {STEPS.map((item, idx) => {
        const isActive = currentStep === item.step;
        const isCompleted = item.step < currentStep && item.step <= maxReachedStep;
        const isClickable = item.step <= maxReachedStep && !isActive;
        const isFuture = item.step > maxReachedStep;

        let stateClass = "";
        if (isActive) stateClass = "breadcrumb-step--active";
        else if (isCompleted) stateClass = "breadcrumb-step--completed";
        else if (isFuture) stateClass = "breadcrumb-step--future";

        return (
          <React.Fragment key={item.step}>
            <button
              type="button"
              className={`breadcrumb-step ${stateClass}`}
              onClick={() => {
                if (isClickable) onStepClick(item.step);
              }}
              disabled={!isClickable}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Step ${item.step}: ${item.label}${isCompleted ? " (completed, click to edit)" : ""}${isFuture ? " (not yet available)" : ""}`}
            >
              <span className="breadcrumb-step__num">
                {isCompleted ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  item.step
                )}
              </span>
              <span className="breadcrumb-step__label">{item.label}</span>
              <span className="breadcrumb-step__short">{item.shortLabel}</span>
            </button>

            {idx < STEPS.length - 1 && (
              <span className="breadcrumb-divider" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
