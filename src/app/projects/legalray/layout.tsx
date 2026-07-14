import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LegalRay — AI Legal Contract Audit SaaS",
  description: "An AI-powered LegalTech SaaS that audits B2B contracts, notarial deeds, and court documents in seconds, flags abusive clauses, and drives conversion through a freemium risk paywall.",
  alternates: { canonical: "/projects/legalray" },
};

export default function LegalRayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
