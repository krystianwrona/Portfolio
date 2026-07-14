import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "LegalRay",
    subtitle: "AI Legal Contract Audit SaaS",
    bg: "#2563EB",
    fg: "#FFFFFF",
  });
}
