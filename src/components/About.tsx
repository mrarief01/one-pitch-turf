export default function About() {
  return (
    <section id="about-turf" style={{ paddingTop: 0 }}>
      <div className="wrap about">
        <div className="about-media reveal">
          <img
            src="/images/about-turf.jpg"
            alt="Wide view of the OnePitch football turf and goal"
          />
        </div>
        <div className="about-body reveal" style={{ transitionDelay: ".1s" }}>
          <p className="eyebrow">The surface</p>
          <h2 style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)", marginTop: "8px" }}>
            One of the largest FIFA-certified grounds in the community
          </h2>
          <p>
            Shock-absorb turf, honest bounce, and drainage that holds up through Perambalur&apos;s weather — for weekday
            training and weekend finals alike.
          </p>
          <div className="fact-row">
            <span className="fact">Shock-absorb surface</span>
            <span className="fact">Warm-up zone</span>
            <span className="fact">Resting area</span>
          </div>
        </div>
      </div>
    </section>
  );
}
