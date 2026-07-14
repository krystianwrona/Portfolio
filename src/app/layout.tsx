import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { Navbar } from "@/components/ui/Navbar";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { Preloader } from "@/components/ui/Preloader";
import { LanguageProvider } from "@/context/LanguageContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://krystianwrona.com"),
  title: {
    default: "Krystian Wrona — AI Product Builder & UI/UX Designer",
    template: "%s | Krystian Wrona",
  },
  description: "Portfolio of Krystian Wrona — architect turned digital creator building AI-powered products and interfaces, from UI/UX design to production-ready code.",
  alternates: { canonical: "/" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans bg-background text-text-primary antialiased selection:bg-accent selection:text-text-primary overflow-x-hidden`}
      >
        <a href="#main-content" className="skip-link no-print">Skip to main content</a>
        <LanguageProvider>
          <Preloader />
          <CustomCursor />
          {/* Analog Noise Overlay — decorative, hidden from AT */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[99999] pointer-events-none opacity-[0.04] mix-blend-difference no-print"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />
          <SmoothScrollProvider>
            <Navbar />
            {children}
          </SmoothScrollProvider>
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
