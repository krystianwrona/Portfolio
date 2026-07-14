import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adoptio — AI-Powered Pet Adoption Platform",
  description: "A social platform matching animal shelters with adopters through a smart lifestyle quiz, geolocation search, and a full shelter management dashboard.",
  alternates: { canonical: "/projects/adoptio" },
};

export default function AdoptioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
