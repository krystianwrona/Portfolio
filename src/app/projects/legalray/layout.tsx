import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "LegalRay — AI Legal Contract Audit SaaS";
const description = "An AI-powered LegalTech SaaS that audits B2B contracts, notarial deeds, and court documents in seconds, flags abusive clauses, and drives conversion through a freemium risk paywall.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects/legalray" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: title,
  description,
  url: `${SITE_URL}/projects/legalray`,
  author: { "@id": PERSON_ID },
  sameAs: "https://legalray-app.vercel.app/",
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
