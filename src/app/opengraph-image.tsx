import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "AI Product Builder & UI/UX Designer",
    subtitle: "Architect turned digital creator — from UI/UX design to production-ready, AI-powered products.",
  });
}
