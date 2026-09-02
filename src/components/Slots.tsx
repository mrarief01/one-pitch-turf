"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Slots() {
  const router = useRouter();

  const slotsData: Array<{ time: string; status: "open" | "filling" | "booked"; label: string }> = [
    { time: "06:00", status: "booked", label: "Booked" },
    { time: "07:00", status: "open", label: "Open" },
    { time: "08:00", status: "open", label: "Open" },
    { time: "17:00", status: "booked", label: "Booked" },
    { time: "18:00", status: "filling", label: "Filling" },
    { time: "19:00", status: "filling", label: "Filling" },
    { time: "20:00", status: "booked", label: "Booked" },
    { time: "21:00", status: "filling", label: "Filling" },
    { time: "22:00", status: "open", label: "Open" },
    { time: "23:00", status: "open", label: "Open" },
    { time: "05:00", status: "open", label: "Open" },
    { time: "16:00", status: "booked", label: "Booked" },
  ];

  return (
    <section className="slots" id="slots">
      <div className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">Today</p>
          <h2>Reserve your slot</h2>
        </div>
        <div className="scoreboard reveal">
          <div className="scoreboard-head">
            <span>SLOT BOARD</span>
            <span className="live">LIVE</span>
          </div>
          <div className="slot-grid">
            {slotsData.map((slot, idx) => (
              <div
                key={idx}
                className={`slot ${slot.status}`}
                onClick={() => router.push("/slots")}
              >
                <span className="time">{slot.time}</span>
                <span className="status">{slot.label}</span>
              </div>
            ))}
          </div>
          <div className="scoreboard-foot">
            <span>Weekends and night hours fill fastest.</span>
            <Link href="/slots" className="btn btn-primary">
              Open Interactive Booking Engine →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
