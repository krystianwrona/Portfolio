import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FashionHero — AI-Driven Seller Retention Strategy",
  description: "A product strategy case study turning a competitor's 0% commission attack into a validated retention experiment — segmentation, an Opportunity Solution Tree, and a working ROI dashboard prototype.",
  alternates: { canonical: "/projects/fashionhero" },
};

export default function FashionHeroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
