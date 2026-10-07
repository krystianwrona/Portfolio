# krystianwrona.com

Source code for my portfolio — five case studies covering product design, frontend development and one architectural thesis.

**Live:** [krystianwrona.com](https://krystianwrona.com)

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Three.js · Vercel

Contact form runs on a Next.js route handler with Resend. Content is bilingual (PL/EN) through a lightweight context-based translation layer — no i18n library.

## Structure

```
src/
  app/
    page.tsx              homepage — hero, project list, about, contact
    projects/<slug>/      one directory per case study
    api/contact/          contact form handler
  components/             shared UI, incl. the WebGL crow scene
  context/                PL/EN language context powering the translation layer
  lib/                    project metadata, SEO constants
  translations/           all PL/EN copy in a single keyed file
```

## Implementation notes

A few decisions that aren't obvious from reading the code:

**Outline project titles** are SVG `<text>` with `paint-order="stroke"` (`src/components/ui/SvgOutlineTitle.tsx`), not stroked HTML text. `-webkit-text-stroke` exposes seams wherever a font's glyph contours overlap — clearly visible on iOS Safari and Chrome Android — and an earlier fix, an opaque HTML fill layer stacked over the stroked one, could not cover seams inside counters or between neighbouring glyphs. In SVG the browser strokes and fills the same path in one pass: the stroke is drawn at twice the visible width and the background-coloured fill covers its inner half, so there is no seam to hide. SVG text neither wraps nor sizes itself, so line breaks are pre-authored (`titleLines` in `src/lib/projects.ts`) and the font size is solved from the measured width (`ProjectTitleFit.tsx` on the homepage, `UpNextCard.tsx` at the end of each case study).

**The carousel** uses `object-fit: contain` against a shared container height so screenshots of different aspect ratios — device mockups, flat dashboards, architectural drawings — sit together without per-image tuning. Scroll-snap centers each slide; the lightbox is desktop-only, since on mobile the image already fills the viewport.

**Screenshots are framed per discipline, not per app:** every app case study uses the same laptop frame (baked into the images in `public/`), while the architecture thesis shows its drawings unframed. The lightbox keyboard and focus handling is shared (`src/lib/useLightboxDialog.ts`); each case study keeps its own markup and narrative.

## Running locally

```bash
npm install
npm run dev
```

```bash
npm test        # contact handler tests — fake email sender, nothing is sent
npm run lint
npx tsc --noEmit
```

The contact form needs `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_EMAIL`; without any one of them the route returns an explicit error rather than a silent false success.

## Contact form

The handler lives in `src/lib/contact.ts`; `src/app/api/contact/route.ts` only plugs in the environment and the Resend SDK. It validates the raw body before reading any field (size, JSON, plain object, string types, required values, length limits, no line breaks in header fields), keeps the honeypot, and reports success only when Resend returns an email id with no error. Resend usually reports failures as `{ data: null, error }` rather than throwing, so both paths end in a generic `send_failed` (502) — provider details go to the server log by name and status code only, never to the browser. On any failure the form keeps what was typed and offers a `mailto:` link prefilled with the subject and message. "Accepted by Resend" is not "delivered to the inbox".

### Spam protection — needs one-time setup

The honeypot stops simple bots. **Rate limiting is not active until the rule below is created** in the Vercel project. It is deliberately not done in code: an in-memory counter lives in a single function instance, Vercel runs as many instances as traffic needs, and each would count separately — it would limit nothing across the deployment. A Vercel WAF rule counts at the edge, before the function runs, and the form already shows a "too many messages" error on a 429.

Rule to create (Dashboard → project `portfolio` → Firewall → Configure → New Rule, or the CLI below):

- Name: `Contact form rate limit`
- If: Request Path equals `/api/contact` **and** Method equals `POST`
- Then: Rate Limit — fixed window, 60 seconds, 5 requests, keyed by IP, action **Too Many Requests (429)**

```bash
npx vercel link            # once, if this checkout is not linked
npx vercel firewall rules add "Contact form rate limit" \
  --condition '{"type":"path","op":"eq","value":"/api/contact"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit --rate-limit-window 60 --rate-limit-requests 5 \
  --rate-limit-keys ip --rate-limit-action log --yes
npx vercel firewall diff   # review, then publish yourself:
npx vercel firewall publish --yes
```

Start with `--rate-limit-action log` as above and watch the Firewall traffic view for a few days. Then, in the dashboard, change what happens when the limit is exceeded from **Log** to **Too Many Requests (429)** and publish. (If you create the rule in the dashboard instead, you can pick 429 straight away; the log step only shows how often real visitors would hit it.)

Check before relying on it: rate-limit rules and their limits depend on the Vercel plan, counters are per region, and the rule is only active once published. To test, send six POSTs within a minute to a deployment (not localhost — the WAF does not run in `next dev`) and expect a 429 on the sixth.

---

© Krystian Wrona. All rights reserved. This code is published to be read, not reused.
