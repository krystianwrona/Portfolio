---
name: tailwind-design-system
description: Tailwind CSS v4 best practices for this portfolio. Apply when building components, layouts, or styling — covers spacing scale, responsive breakpoints, color utilities, component patterns, and dark mode.
---

# Tailwind CSS v4 Design System — Portfolio Guidelines

**Version**: Tailwind CSS v4 · PostCSS · Next.js 16 App Router

---

## 1. v4 Key Differences (vs v3)

| Feature | v3 | v4 |
|---|---|---|
| Config file | `tailwind.config.js` | CSS-first (`@theme` in CSS) |
| Prefix | `tw-` optional | same |
| Arbitrary values | `[]` syntax | same + improved |
| CSS variables | manual | auto-generated from `@theme` |
| `darkMode` | `class` / `media` | `@variant dark` |
| PostCSS plugin | `tailwindcss` | `@tailwindcss/postcss` |

> This project uses `@tailwindcss/postcss` — no `tailwind.config.js` needed.

---

## 2. Design Tokens (globals.css)

Custom tokens live in `globals.css` under `@theme`. Reference them as CSS vars or Tailwind utilities:

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-accent:        #FACC15;   /* yellow-400 — brand accent */
  --color-background:    #F5F5F4;   /* stone-100 — light bg */
  --color-surface:       #111111;   /* near-black — dark sections */
  --color-text-primary:  #111111;
  --color-text-muted:    rgba(17,17,17,0.5);

  /* Typography */
  --font-sans: var(--font-montserrat), var(--font-inter), ui-sans-serif, system-ui;

  /* Radius */
  --radius-card: 32px;
  --radius-pill: 9999px;
}
```

Usage:
```tsx
// ✅ Via utility class (auto-generated)
<div className="bg-background text-accent" />

// ✅ Via CSS variable (inline style / arbitrary)
<div className="bg-[var(--color-accent)]" />
```

---

## 3. Spacing Scale — Portfolio Conventions

Use Tailwind's default 4px base scale. Portfolio-specific patterns:

```
Section vertical padding:  py-[20vh]      (hero-sized sections)
Section vertical padding:  py-16 md:py-48 (content sections)
Section horizontal pad:    px-8 md:px-[4vw]
Card padding:              p-8 md:p-10
Gap between cards:         gap-4 sm:gap-6 md:gap-8
Heading letter-spacing:    tracking-tighter
Body letter-spacing:       tracking-[0.2em]  (uppercase labels)
```

---

## 4. Responsive Breakpoints

Tailwind v4 defaults (unchanged from v3):

| Prefix | Min-width | Use case |
|---|---|---|
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets, desktop threshold |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |
| `2xl:` | 1536px | Ultra-wide |

Portfolio patterns:
```tsx
// Mobile-first — always write mobile base, then md: / lg: overrides
className="text-[13vw] md:text-8xl lg:text-[8vw]"
className="flex-col md:flex-row"
className="py-16 md:py-48"
className="hidden md:flex"   // desktop-only
className="md:hidden"        // mobile-only
```

---

## 5. Typography Utilities

```tsx
// Display / hero headings
className="font-sans font-black text-[12vw] lg:text-[6vw] leading-[0.85] tracking-tighter uppercase"

// Section labels (eyebrow text)
className="text-xs md:text-sm uppercase tracking-[0.2em] text-gray-400"

// Body text
className="text-[1rem] leading-[1.6] font-medium opacity-80"

// Button / CTA labels
className="text-xs font-bold uppercase tracking-widest"
```

Font variables set in `layout.tsx`:
- `--font-inter` → utility font
- `--font-montserrat` → display headings (`font-sans` maps here)

---

## 6. Color Usage Patterns

```tsx
// Dark section (projects, contact)
className="bg-[#111] text-white"

// Light section (hero bg, about)
className="bg-[#F5F5F4] text-[#111]"

// Accent (hover states, highlights)
className="text-yellow-400"               // Tailwind utility
className="hover:text-[#FACC15]"          // arbitrary

// Muted / ghost text
className="text-white/60"                 // opacity modifier
className="opacity-50"                    // on child element

// Brand colors (project-specific, use inline style)
style={{ color: project.color }}          // dynamic
```

---

## 7. Component Patterns

### Card
```tsx
<div className="p-10 rounded-[32px] bg-[#E4E4E7]/40 text-[#111]">
  {/* content */}
</div>
```

### Pill button
```tsx
<button className="px-10 py-4 min-h-[48px] bg-white text-[#111] font-black uppercase tracking-widest text-sm rounded-full">
  Label
</button>
```

### Section label (eyebrow)
```tsx
<p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-8 md:mb-20">
  Selected Works 2026
</p>
```

### Focus-visible ring (accessibility)
```tsx
className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
```

### Minimum tap target (mobile a11y)
```tsx
className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
```

---

## 8. Utility Combinations (clsx / tailwind-merge)

Both `clsx` and `tailwind-merge` are installed:

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine them for conditional + conflict-safe classes
const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(...args));

// Usage
<div className={cn(
  "px-4 py-2 rounded-lg font-bold text-sm",
  isActive && "bg-yellow-400 text-black",
  isDisabled && "opacity-50 cursor-not-allowed",
)} />
```

---

## 9. Dark Mode

v4 uses `@variant dark` (CSS-first), not a `darkMode` config key.

```css
/* globals.css */
@variant dark (&:where(.dark, .dark *));
```

```tsx
// In component
<div className="bg-white dark:bg-[#111] text-black dark:text-white" />
```

> This portfolio currently uses **hardcoded dark sections** (`bg-[#111]`) rather than a global dark mode toggle. Do not add `dark:` variants unless introducing a proper theme toggle.

---

## 10. Anti-patterns — Never Do

```tsx
// ❌ Animating layout via Tailwind transitions (use Framer Motion instead)
className="transition-all duration-500 h-0 group-hover:h-auto"

// ❌ Mixing Tailwind transition + Framer Motion on same property
// (they compete — pick one)

// ❌ Hardcoding pixel values when a scale value exists
className="mt-[16px]"  // → use mt-4

// ❌ Skipping mobile-first
className="lg:flex hidden"  // → use hidden lg:flex (mobile-first order)

// ❌ Using @apply in component files
// Only use @apply in globals.css for base styles (skip-link, etc.)

// ❌ Duplicate color definitions
// One source of truth: @theme in globals.css
```

---

## 11. Global Base Styles (globals.css patterns)

```css
/* Skip link — accessibility */
.skip-link {
  @apply sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
         focus:z-[999999] focus:px-4 focus:py-2 focus:bg-accent focus:text-black
         focus:rounded focus:font-bold focus:text-sm;
}

/* Selection color */
::selection {
  background: theme(colors.yellow.400);
  color: #111;
}

/* Smooth scroll — handled by Lenis, not CSS */
/* html { scroll-behavior: smooth; } — DO NOT add, conflicts with Lenis */
```
