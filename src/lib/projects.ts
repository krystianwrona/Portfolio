export interface ProjectMeta {
  id: string;
  title: string;
  brand: string;
}

export const PROJECTS: Record<string, ProjectMeta> = {
  "folk-culture-center": { id: "folk-culture-center", title: "Folk Culture Center", brand: "#FFFFFF" },
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
