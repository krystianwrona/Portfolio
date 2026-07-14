import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

export function renderOgImage({
  title,
  subtitle,
  bg = "#111111",
  fg = "#F5F5F4",
  accent,
}: {
  title: string;
  subtitle?: string;
  bg?: string;
  fg?: string;
  accent?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: bg,
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: accent ?? fg,
            opacity: 0.6,
            marginBottom: 24,
          }}
        >
          KRYSTIAN.WRONA
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: fg,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: fg,
              opacity: 0.7,
              marginTop: 24,
              maxWidth: 900,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    ),
    ogImageSize
  );
}
