import type { Metadata } from "next";
import { Teko, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const teko = Teko({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OnePitch — Perambalur",
  description: "FIFA Quality Pro turf for cricket and football in Perambalur, lit for play long after sundown.",
  openGraph: {
    title: "OnePitch — Perambalur",
    description: "FIFA Quality Pro turf for cricket and football in Perambalur, lit for play long after sundown.",
    url: "https://one-pitch-turf.vercel.app/",
    siteName: "OnePitch Turf",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${teko.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
