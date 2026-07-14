import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "Ania Kampania",
    subtitle: "Boutique Travel Brand & Booking Site",
    bg: "#B25818",
    fg: "#FFFFFF",
  });
}
