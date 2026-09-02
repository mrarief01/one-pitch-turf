export default function Contact() {
  return (
    <section id="contact" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="contact reveal">
          <div className="contact-info">
            <p className="eyebrow">Find us</p>
            <h2>Come play</h2>
            <p>Open daily. Walk-ins welcome when slots are free.</p>
            <div className="cline">
              <span className="label">Address</span>
              <span>Collector Office Road, Abiramapuram, Perambalur, Tamil Nadu 621212</span>
            </div>
            <div className="cline">
              <span className="label">Phone</span>
              <a href="tel:9952323211">99523 23211</a>
            </div>
            <div className="cline">
              <span className="label">Email</span>
              <a href="mailto:onepitchturf@gmail.com">onepitchturf@gmail.com</a>
            </div>
            <div className="social-row">
              <a
                href="https://www.instagram.com/onepitchturf/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="3.6" />
                  <circle cx="17.3" cy="6.7" r="1" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61581743902127"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M15 3h-2a5 5 0 0 0-5 5v3H6v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="contact-map">
            <iframe
              loading="lazy"
              src="https://maps.google.com/maps?q=Collector%20Office%20Road%2C%20Abiramapuram%2C%20Perambalur%2C%20Tamil%20Nadu%20621212&t=&z=15&ie=UTF8&iwloc=&output=embed"
              title="OnePitch location map"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
