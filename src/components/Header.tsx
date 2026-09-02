"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // On subpages, always have solid background for clear visibility, on home page use scroll
  const isSolid = pathname !== "/" || isScrolled;

  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Facilities", href: "/facilities" },
    { label: "Slots", href: "/slots" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header id="header" className={isSolid ? "solid" : ""}>
      <nav className="wrap">
        <Link href="/" className="logo" onClick={closeMenu}>
          <span className="dot"></span>OnePitch
        </Link>
        <ul className={`nav-links ${isMenuOpen ? "open" : ""}`} id="navLinks">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  style={isActive ? { color: "var(--flood)" } : {}}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link href="/slots" className="btn btn-primary" onClick={closeMenu}>
            Book a Slot
          </Link>
          <button
            className="burger"
            id="burger"
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    </header>
  );
}
