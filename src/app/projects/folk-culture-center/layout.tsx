import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "Centrum Kultury Ludowej (Folk Culture Center) — Underground Cultural Venue";
const description = "A master's thesis project burying a 4,400 m² concert hall and folk museum underground to protect heritage parkland — spatial design, circulation architecture, and accessibility case study.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects/folk-culture-center" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  name: title,
  description,
  url: `${SITE_URL}/projects/folk-culture-center`,
  author: { "@id": PERSON_ID },
};

export default function FolkCultureCenterLayout({ children }: { children: React.ReactNode }) {
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
