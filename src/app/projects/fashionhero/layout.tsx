import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "FashionHero — AI-Driven Seller Retention Strategy";
const description = "A product strategy case study turning a competitor's 0% commission attack into a validated retention experiment — segmentation, an Opportunity Solution Tree, and a working ROI dashboard prototype.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects/fashionhero" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  name: title,
  description,
  url: `${SITE_URL}/projects/fashionhero`,
  author: { "@id": PERSON_ID },
};

export default function FashionHeroLayout({ children }: { children: React.ReactNode }) {
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
