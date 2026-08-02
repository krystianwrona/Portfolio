import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "LegalRay — Contract Analysis Across Five Jurisdictions";
const description = "A LegalTech SaaS that analyses B2B contracts, notarial deeds and court documents under Polish, German, English, Spanish or Italian law, flags unfair clauses and cites the article or provision behind each finding. Informational analysis only — not legal advice.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects/legalray" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LegalRay",
  description,
  applicationCategory: "BusinessApplication",
  url: "https://legalray-app.vercel.app/",
  mainEntityOfPage: `${SITE_URL}/projects/legalray`,
  author: { "@id": PERSON_ID },
  disambiguatingDescription:
    "LegalRay produces informational analysis. It is not legal advice and does not replace a lawyer.",
};

export default function LegalRayLayout({ children }: { children: React.ReactNode }) {
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
