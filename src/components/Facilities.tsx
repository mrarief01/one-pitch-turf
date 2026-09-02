export default function Facilities() {
  return (
    <section id="facilities">
      <div className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">What you're playing on</p>
          <h2>Built for both games</h2>
        </div>
      </div>
      <div className="tile-row reveal">
        <div className="tile">
          <img
            src="/images/facility-fifa.jpg"
            alt="FIFA Basic football on the pitch marking"
          />
          <div className="tile-label">
            <span className="num">01</span>
            <h3>FIFA Quality Pro</h3>
            <p>Certified surface, tournament-ready.</p>
          </div>
        </div>
        <div className="tile">
          <img
            src="/images/facility-floodlit.jpg"
            alt="Glowing cricket stumps at night"
          />
          <div className="tile-label">
            <span className="num">02</span>
            <h3>Floodlit Nights</h3>
            <p>Play on, well past sundown.</p>
          </div>
        </div>
        <div className="tile">
          <img
            src="/images/facility-dual.jpg"
            alt="Cricket bats and ball on the turf"
          />
          <div className="tile-label">
            <span className="num">03</span>
            <h3>Dual-Sport Turf</h3>
            <p>Cricket by day, football by night.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
