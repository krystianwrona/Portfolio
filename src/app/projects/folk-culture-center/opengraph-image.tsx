import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "Centrum Kultury Ludowej",
    subtitle: "Folk Culture Center — Underground Cultural Venue, 2023",
    bg: "#111111",
    fg: "#F5F5F4",
  });
}
