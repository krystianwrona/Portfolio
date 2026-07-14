import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";
import { PROJECTS } from "@/lib/projects";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "LegalRay",
    subtitle: "AI Legal Contract Audit SaaS",
    bg: PROJECTS.legalray.brand,
    fg: "#FFFFFF",
  });
}
