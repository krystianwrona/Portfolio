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
  titleScale?: number;    // mobile + tablet (below the lg breakpoint)
  titleScaleLg?: number;  // lg breakpoint and up
}

export const PROJECTS: Record<string, ProjectMeta> = {
  "folk-culture-center": { id: "folk-culture-center", title: "Centrum Kultury Ludowej", brand: "#FFFFFF", titleScale: 0.5, titleScaleLg: 0.75 },
  "adoptio":             { id: "adoptio",             title: "Adoptio",             brand: "#F97316" },
  "legalray":            { id: "legalray",            title: "LegalRay",            brand: "#2563EB" },
  "fashionhero":         { id: "fashionhero",          title: "FashionHero",         brand: "#E11D48" },
  "ania-kampania":       { id: "ania-kampania",        title: "Ania Kampania",       brand: "#B25818" },
};

export const PROJECT_ORDER = [
  "folk-culture-center",
  "adoptio",
  "legalray",
  "fashionhero",
  "ania-kampania",
] as const;
