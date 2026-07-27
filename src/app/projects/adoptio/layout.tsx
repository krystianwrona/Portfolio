import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "Adoptio — AI-Powered Pet Adoption Platform";
const description = "A social platform matching animal shelters with adopters through a smart lifestyle quiz, geolocation search, and a full shelter management dashboard.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects/adoptio" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: title,
  description,
  url: `${SITE_URL}/projects/adoptio`,
  author: { "@id": PERSON_ID },
  sameAs: "https://adoptio.pl",
};

export default function AdoptioLayout({ children }: { children: React.ReactNode }) {
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
