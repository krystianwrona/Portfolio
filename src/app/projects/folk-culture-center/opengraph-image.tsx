import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderOgImage({
    title: "Folk Culture Center",
    subtitle: "Underground Cultural Venue — Master's Degree Project, 2023",
    bg: "#111111",
    fg: "#F5F5F4",
  });
}
