export interface ProjectMeta {
  id: string;
  title: string;
  brand: string;
  // Explicit line breaks for the SVG title (SVG <text> doesn't wrap on its
  // own, unlike the HTML it replaced). Omit for single-word titles — they
  // default to one line. Order matches how the title should read top to
  // bottom.
  //
  // These are EDITORIAL decisions, not fit decisions: they say how a title
  // should read, never how big it has to be to survive a given viewport. The
  // homepage list solves size separately and continuously from the width the
  // layout leaves over (src/components/ui/ProjectTitleFit.tsx), so there is no
  // per-project scale to keep in sync with a break here.
  titleLines?: string[];
  // Mobile-only (below md) override for titleLines, where a title reads better
  // broken differently on a phone than on a wide row.
  titleLinesMobile?: string[];
}

export const PROJECTS: Record<string, ProjectMeta> = {
  "folk-culture-center": { id: "folk-culture-center", title: "Centrum Kultury Ludowej", brand: "#FFFFFF", titleLines: ["Centrum", "Kultury", "Ludowej"] },
  "adoptio":             { id: "adoptio",             title: "Adoptio",             brand: "#F97316" },
  "legalray":            { id: "legalray",            title: "LegalRay",            brand: "#2563EB" },
  "fashionhero":         { id: "fashionhero",          title: "FashionHero",         brand: "#E11D48" },
  "ania-kampania":       { id: "ania-kampania",        title: "Ania Kampania",       brand: "#B25818", titleLines: ["Ania Kampania"], titleLinesMobile: ["Ania", "Kampania"] },
};

export const PROJECT_ORDER = [
  "folk-culture-center",
  "adoptio",
  "legalray",
  "fashionhero",
  "ania-kampania",
] as const;
