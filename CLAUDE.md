# Portfolio — Krystian Wrona

## Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Three.js / React Three Fiber (ptak z cząsteczek w hero)
- Lenis (smooth scroll)

## Struktura
- `src/app/page.tsx` — główna strona (hero, projekty, beyond the code, kontakt)
- `src/app/projects/folk-culture-center/page.tsx` — case study Centrum Kultury Ludowej (praca magisterska 2023)
- `src/app/projects/adoptio/page.tsx` — case study Adoptio
- `src/app/projects/legalray/page.tsx` — case study LegalRay
- `src/app/projects/fashionhero/page.tsx` — case study FashionHero
- `src/app/projects/ania-kampania/page.tsx` — case study Ania Kampania
- `src/lib/projects.ts` — single source of truth for brand colors and project order
- `src/components/ui/Navbar.tsx` — nawigacja + WRONA↔CROW toggle
- `src/components/ui/Preloader.tsx` — preloader K.W
- `src/components/ui/CustomCursor.tsx` — custom cursor
- `src/components/SmoothScrollProvider.tsx` — Lenis wrapper
- `src/context/LanguageContext.tsx` — przełącznik PL/EN
- `src/translations/index.ts` — tłumaczenia

## Design
- Motyw: ciemny brutalizm z jasnymi elementami
- Accent color: żółty #FACC15
- Hero: ptak z cząsteczek (Three.js) + blok tekstowy w lewym dolnym rogu (kicker / headline / meta / CTA)
- Ptak reaguje na kursor + głowa obraca się w stronę widza
- Case study: ciemny hero z brand color + jasny content poniżej

## Brand colors
Defined once in `src/lib/projects.ts` (`PROJECTS[id].brand`) — update there, not per-page.
- Folk Culture Center: no brand color (white on dark / black on light)
- Adoptio: #F97316 (Orange-500)
- LegalRay: #2563EB (Blue-600)
- FashionHero: #E11D48 (Rose-600)
- Ania Kampania: #B25818

## Projects order (homepage + Up Next chain)
1. Folk Culture Center → /projects/folk-culture-center → Up Next: Adoptio
2. Adoptio → /projects/adoptio → Up Next: LegalRay
3. LegalRay → /projects/legalray → Up Next: FashionHero
4. FashionHero → /projects/fashionhero → Up Next: Ania Kampania
5. Ania Kampania → /projects/ania-kampania → Up Next: Folk Culture Center

## Ważne
- NIGDY nie zmieniaj logiki ptaka (CrowShaderMesh, teraz w `src/components/CrowScene.tsx`) bez pytania
- Hero text block: widoczny od razu (fade + 12px translate, 600ms, start 300ms po mount) — NIE może czekać na załadowanie sceny z ptakiem. Kontener ma pointer-events: none, tylko przycisk i link mają auto, żeby ptak dalej reagował na kursor
- prefers-reduced-motion: wyłącz animacje
- Strona musi startować od góry (scrollTo 0,0)
-- CountUp animating intermediate values (0,1,2,3...) for screen readers is INTENTIONAL — do NOT add aria-hidden or sr-only overrides
- ∞ symbol in stats is INTENTIONAL as-is — do NOT change its aria-label or add context

Podczas pracy nad interfejsem, animacjami lub audytem kodu, bezwzględnie stosuj zasady i wytyczne opisane w plikach Markdown znajdujących się w folderze .claude/skills/. Przeczytaj je przed wygenerowaniem komponentu.