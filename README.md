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

**Outline project titles** are two stacked `<h3>` layers rather than `-webkit-text-stroke` alone. Stroking live text exposes seams wherever a font's glyph contours overlap — clearly visible on iOS Safari and Chrome Android. An opaque fill layer in the section's own background color covers those seams from the inside, leaving a clean outline. The absolutely positioned layer must stay on top; swapping the roles reintroduces the bug.

**The carousel** uses `object-fit: contain` against a shared container height so screenshots of different aspect ratios — device mockups, flat dashboards, architectural drawings — sit together without per-image tuning. Scroll-snap centers each slide; the lightbox is desktop-only, since on mobile the image already fills the viewport.

**Each project is framed in the visual language of its own discipline** rather than forced into one template: device mockups for the consumer apps, browser chrome for the data-dense dashboard, unframed drawings for the architecture thesis. Consistency within a single carousel matters more than consistency across projects — nobody views two case studies side by side.

## Running locally

```bash
npm install
npm run dev
```

The contact form needs `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_EMAIL`; without any one of them the route returns an explicit error rather than a silent false success.

---

© Krystian Wrona. All rights reserved. This code is published to be read, not reused.
