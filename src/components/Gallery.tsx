export default function Gallery() {
  return (
    <section id="gallery">
      <div className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">On the pitch</p>
          <h2>Matchday</h2>
        </div>
        <div className="gallery-grid reveal">
          <div className="g-item">
            <img
              src="/images/gallery-1.jpg"
              alt="Aerial view of the turf at night"
            />
            <span className="cap">Night at OnePitch</span>
          </div>
          <div className="g-item">
            <img
              src="/images/gallery-2.jpg"
              alt="Cricket stumps in daylight"
            />
            <span className="cap">Daytime cricket</span>
          </div>
          <div className="g-item">
            <img
              src="/images/gallery-3.jpg"
              alt="Tennis ball on the pitch line"
            />
            <span className="cap">Pitch markings</span>
          </div>
          <div className="g-item">
            <img
              src="/images/gallery-4.jpg"
              alt="Football and goal at night"
            />
            <span className="cap">Under the lights</span>
          </div>
        </div>
      </div>
    </section>
  );
}
