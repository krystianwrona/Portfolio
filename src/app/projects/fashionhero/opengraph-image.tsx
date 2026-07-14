import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";
import { PROJECTS } from "@/lib/projects";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "FashionHero",
    subtitle: "AI-Driven Seller Retention Strategy",
    bg: PROJECTS.fashionhero.brand,
    fg: "#FFFFFF",
  });
}
