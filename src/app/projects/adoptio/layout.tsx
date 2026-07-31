import type { Metadata } from "next";
import { SITE_URL, PERSON_ID } from "@/lib/seo";

const title = "Adoptio — Pet Adoption Matched by Lifestyle";
const description = "Shelters publish their animals; an eleven-step lifestyle quiz scores every animal into match points, and Gemini 2.5 Flash reranks the top thirty and writes a reason for each. Local search, a shelter map, and a shelter panel with an adoption Kanban.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects/adoptio" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Adoptio",
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
