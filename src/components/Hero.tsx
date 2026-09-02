import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="bg">
        <img
          src="/images/hero-turf.jpg"
          alt="OnePitch dual turf under floodlights, aerial night view"
        />
      </div>
      <div className="wrap hero-content">
        <p className="eyebrow reveal">Perambalur</p>
        <h1 className="reveal" style={{ transitionDelay: ".05s" }}>
          One pitch.<br />Two <em>games.</em>
        </h1>
        <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
          FIFA Quality Pro turf for cricket and football, lit for play long after sundown.
        </p>
        <div className="hero-cta reveal" style={{ transitionDelay: ".15s" }}>
          <Link href="/slots" className="btn btn-primary">
            Book Your Slot
          </Link>
          <a href="tel:9952323211" className="btn btn-ghost">
            Call 99523 23211
          </a>
        </div>
      </div>
      <div className="scroll-cue">SCROLL</div>
    </section>
  );
}
