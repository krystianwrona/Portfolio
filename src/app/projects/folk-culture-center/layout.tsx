import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Folk Culture Center — Underground Cultural Venue",
  description: "A master's thesis project burying a 4,400 m² concert hall and folk museum underground to protect heritage parkland — spatial design, circulation architecture, and accessibility case study.",
  alternates: { canonical: "/projects/folk-culture-center" },
};

export default function FolkCultureCenterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
