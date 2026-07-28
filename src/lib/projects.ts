export interface ProjectMeta {
  id: string;
  title: string;
  brand: string;
  // Scales the homepage list title's font-size (and its stroke width in step)
  // for titles too long to wrap to two lines at the standard size. Omit both
  // for the standard 1x size — only override when a title actually needs it.
  // Split in two because the mobile/tablet title size is a fixed px value
  // while the desktop (lg+) size is viewport-relative — a single multiplier
  // can't satisfy both ranges at once (one wraps to 3 lines, the other
  // collapses to 1) once a title needs shrinking at all.
  titleScale?: number;    // tablet (md up to the lg breakpoint)
  titleScaleLg?: number;  // lg breakpoint and up
  // Explicit line breaks for the SVG title (SVG <text> doesn't wrap on its
  // own, unlike the HTML it replaced). Omit for single-word titles — they
  // default to one line. Order matches how the title should read top to
  // bottom.
  titleLines?: string[];
  // Mobile-only (below md) override for titleLines. Some titles need a
  // different line break below md than at md+ — e.g. a title that wraps to
  // 2 lines at tablet/desktop width needs 3 shorter lines on a phone.
  // Mobile font-size itself is a single shared scale applied to every
  // title alike (the 0.7476 literal in ProjectRow's className, page.tsx),
  // not a per-project override — see the comment next to it for why.
  titleLinesMobile?: string[];
}

export const PROJECTS: Record<string, ProjectMeta> = {
  "folk-culture-center": { id: "folk-culture-center", title: "Centrum Kultury Ludowej", brand: "#FFFFFF", titleScale: 0.55, titleScaleLg: 0.75, titleLines: ["Centrum Kultury", "Ludowej"], titleLinesMobile: ["Centrum", "Kultury", "Ludowej"] },
  "adoptio":             { id: "adoptio",             title: "Adoptio",             brand: "#F97316" },
  "legalray":            { id: "legalray",            title: "LegalRay",            brand: "#2563EB" },
  "fashionhero":         { id: "fashionhero",          title: "FashionHero",         brand: "#E11D48" },
  "ania-kampania":       { id: "ania-kampania",        title: "Ania Kampania",       brand: "#B25818", titleLines: ["Ania", "Kampania"] },
};

export const PROJECT_ORDER = [
  "folk-culture-center",
  "adoptio",
  "legalray",
  "fashionhero",
  "ania-kampania",
] as const;
