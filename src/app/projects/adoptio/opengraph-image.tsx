import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";
import { PROJECTS } from "@/lib/projects";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "Adoptio",
    subtitle: "AI-Powered Pet Adoption Platform",
    bg: PROJECTS.adoptio.brand,
    fg: "#FFFFFF",
  });
}
