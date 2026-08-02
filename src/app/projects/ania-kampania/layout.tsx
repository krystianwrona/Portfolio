import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "Ania Kampania — Brand, Offer Architecture & Booking Site";
const description = "How a personal brand was built from the name up for a travel designer working in Campania: a position taken against the category, a defined audience, a four-rung offer priced rung by rung — and the Next.js 16 site, Cal.eu booking and interactive ebooks that carry it to market.";

const PAGE_URL = `${SITE_URL}/projects/ania-kampania`;

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
  url: PAGE_URL,
  author: { "@id": PERSON_ID },
  // The case study is written in both languages behind the PL/EN toggle; the
  // markup is the only place a crawler can learn that, since both live at one URL.
  inLanguage: ["en", "pl"],
  image: `${PAGE_URL}/opengraph-image`,
  // Month precision on publication — the day was not recorded. dateModified is
  // exact and must be bumped whenever the copy on this page changes.
  datePublished: "2026-07",
  dateModified: "2026-08-02",
  // NOT sameAs — the client's website is a different entity from this case study
  // about it. `about` says "this page is about that thing", which is true.
  about: [
    {
      "@type": "WebSite",
      name: "Ania Kampania",
      url: "https://aniakampania.pl",
    },
  ],
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
