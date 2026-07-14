import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";
import { PROJECTS } from "@/lib/projects";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "Ania Kampania",
    subtitle: "Boutique Travel Brand & Booking Site",
    bg: PROJECTS["ania-kampania"].brand,
    fg: "#FFFFFF",
  });
}
