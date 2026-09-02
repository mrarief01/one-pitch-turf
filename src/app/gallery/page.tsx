"use client";

import Header from "@/components/Header";
import Gallery from "@/components/Gallery";
import CtaBand from "@/components/CtaBand";
import Footer from "@/components/Footer";
import { useReveal } from "@/hooks/useReveal";

export default function GalleryPage() {
  useReveal();

  return (
    <>
      <Header />
      <main style={{ paddingTop: "100px" }}>
        <Gallery />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
