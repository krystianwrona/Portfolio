import type { MetadataRoute } from "next";

const BASE_URL = "https://krystianwrona.com";

const PROJECT_SLUGS = [
  "folk-culture-center",
  "adoptio",
  "legalray",
  "fashionhero",
  "ania-kampania",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    ...PROJECT_SLUGS.map((slug) => ({
      url: `${BASE_URL}/projects/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
