import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ania Kampania — Boutique Travel Brand & Booking Site",
  description: "A personal-brand website for a boutique travel-design service in Campania and the Amalfi Coast, with a real Cal.eu booking system, three-tier packages, and a full legal and SEO foundation for the Polish market.",
  alternates: { canonical: "/projects/ania-kampania" },
};

export default function AniaKampaniaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
