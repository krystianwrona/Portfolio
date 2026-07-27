import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "Ania Kampania — Boutique Travel Brand & Booking Site";
const description = "A personal-brand website for a boutique travel-design service in Campania and the Amalfi Coast, with a real Cal.eu booking system, three-tier packages, and a full legal and SEO foundation for the Polish market.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects/ania-kampania" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  name: title,
  description,
  url: `${SITE_URL}/projects/ania-kampania`,
  author: { "@id": PERSON_ID },
  sameAs: "https://aniakampania.pl",
};

export default function AniaKampaniaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {children}
    </>
  );
}
