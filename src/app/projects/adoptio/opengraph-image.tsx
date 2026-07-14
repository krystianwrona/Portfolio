import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "Adoptio",
    subtitle: "AI-Powered Pet Adoption Platform",
    bg: "#F97316",
    fg: "#FFFFFF",
  });
}
