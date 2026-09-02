"use client";

import Header from "@/components/Header";
import Facilities from "@/components/Facilities";
import About from "@/components/About";
import CtaBand from "@/components/CtaBand";
import Footer from "@/components/Footer";
import { useReveal } from "@/hooks/useReveal";

export default function FacilitiesPage() {
  useReveal();

  return (
    <>
      <Header />
      <main style={{ paddingTop: "100px" }}>
        <Facilities />
        <About />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
