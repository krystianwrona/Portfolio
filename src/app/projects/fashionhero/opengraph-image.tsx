import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "FashionHero",
    subtitle: "AI-Driven Seller Retention Strategy",
    bg: "#E11D48",
    fg: "#FFFFFF",
  });
}
