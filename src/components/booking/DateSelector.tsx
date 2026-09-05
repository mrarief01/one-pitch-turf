"use client";

import React, { useRef } from "react";
import { formatISODate } from "@/lib/bookingStore";

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  daysCount?: number;
}

export default function DateSelector({
  selectedDate,
  onSelectDate,
  daysCount = 7, // 1 week alone as requested
}: DateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate date list for 1 week (7 days) starting from today
  const today = new Date();
  const todayISO = formatISODate(today);

  const dates = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = formatISODate(d);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dayNum = String(d.getDate()).padStart(2, "0");
    const monthName = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const isToday = iso === todayISO;

    return {
      iso,
      dayName,
      dayNum,
      monthName,
      isToday,
      fullDisplay: d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    };
  });

  const handleScroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="date-selector-section">
      <div className="section-title-row date-title-row">
        <div>
          <span className="eyebrow">Step 2</span>
          <h2 className="step-title">Select Booking Date (Next 7 Days)</h2>
        </div>
        <div className="date-nav-controls">
          <button
            type="button"
            className="date-nav-btn"
            onClick={() => handleScroll(-180)}
            aria-label="Scroll dates left"
          >
            ←
          </button>
          <button
            type="button"
            className="date-nav-btn"
            onClick={() => handleScroll(180)}
            aria-label="Scroll dates right"
          >
            →
          </button>
        </div>
      </div>

      <div className="date-scroll-container date-seven-days-grid" ref={scrollRef}>
        {dates.map((item) => {
          const isSelected = selectedDate === item.iso;

          return (
            <button
              key={item.iso}
              type="button"
              className={`date-pill ${isSelected ? "date-selected" : ""} ${
                item.isToday ? "date-is-today" : ""
              }`}
              onClick={() => onSelectDate(item.iso)}
            >
              {item.isToday && <span className="today-badge">Today</span>}
              <span className="date-weekday">{item.dayName}</span>
              <span className="date-number">{item.dayNum}</span>
              <span className="date-month">{item.monthName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
