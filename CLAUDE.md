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
- `src/app/projects/legalray/page.tsx` — case study LegalRay
- `src/app/projects/adoptme/page.tsx` — case study Adoptio
- `src/app/projects/classified/page.tsx` — case study Confidential
- `src/components/ui/Navbar.tsx` — nawigacja + WRONA↔CROW toggle
- `src/components/ui/Preloader.tsx` — preloader K.W
- `src/components/ui/CustomCursor.tsx` — custom cursor
- `src/components/SmoothScrollProvider.tsx` — Lenis wrapper
- `src/context/LanguageContext.tsx` — przełącznik PL/EN
- `src/translations/index.ts` — tłumaczenia

## Design
- Motyw: ciemny brutalizm z jasnymi elementami
- Accent color: żółty #FACC15
- Hero: ptak z cząsteczek (Three.js) + ghost outline text "WHERE ARCHITECTURE MEETS CODE"
- Ptak reaguje na kursor + głowa obraca się w stronę widza
- Case study: ciemny hero z brand color + jasny content poniżej

## Brand colors
- LegalRay: #2563EB (Blue-600)
- Adoptio: #F97316 (Orange-500)
- Confidential: #1A1A1A

## Ważne
- NIGDY nie zmieniaj logiki ptaka (CrowShaderMesh) bez pytania
- Ghost text w hero: scroll-reveal, hidden na mobile, wariant C (mały tekst) na mobile
- prefers-reduced-motion: wyłącz animacje
- Strona musi startować od góry (scrollTo 0,0)
- Hero bez tekstu na wejściu to CELOWY zabieg — ghost text pojawia się przy scrollu jako element zaskoczenia. NIE dodawać tagline/tekstu widocznego przed scrollem.
-- CountUp animating intermediate values (0,1,2,3...) for screen readers is INTENTIONAL — do NOT add aria-hidden or sr-only overrides
- ∞ symbol in stats is INTENTIONAL as-is — do NOT change its aria-label or add context
- Hero with no text before scroll is INTENTIONAL — ghost text on scroll is a surprise element, do NOT add visible tagline before scroll

Podczas pracy nad interfejsem, animacjami lub audytem kodu, bezwzględnie stosuj zasady i wytyczne opisane w plikach Markdown znajdujących się w folderze .claude/skills/. Przeczytaj je przed wygenerowaniem komponentu.