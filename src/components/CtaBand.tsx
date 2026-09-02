import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="cta-band">
      <div className="bg">
        <img
          src="/images/cta-turf.jpg"
          alt="OnePitch turf at night"
        />
      </div>
      <div className="wrap cta-band-content reveal">
        <h2>
          Your next match<br />starts here
        </h2>
        <p>Follow us for slot availability and match highlights.</p>
        <div className="hero-cta">
          <Link href="/slots" className="btn btn-primary">
            Book Your Slot
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
