"use client";

import Header from "@/components/Header";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useReveal } from "@/hooks/useReveal";

export default function ContactPage() {
  useReveal();

  return (
    <>
      <Header />
      <main style={{ paddingTop: "100px" }}>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
