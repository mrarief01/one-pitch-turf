import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="wrap foot-row">
        <p>© 2026 ONEPITCH — PERAMBALUR, TAMIL NADU</p>
        <div className="foot-links">
          <Link href="/">Home</Link>
          <Link href="/facilities">Facilities</Link>
          <Link href="/slots">Slots</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
