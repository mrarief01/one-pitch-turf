"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Facilities from "@/components/Facilities";
import About from "@/components/About";
// import Slots from "@/components/Slots";
import Gallery from "@/components/Gallery";
import CtaBand from "@/components/CtaBand";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useReveal } from "@/hooks/useReveal";

export default function Home() {
  useReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Facilities />
        <About />
        {/* <Slots /> */}
        <Gallery />
        <CtaBand />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
