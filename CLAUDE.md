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
- `src/components/crow/CrowStage.tsx` — host canvasu ptaka (fixed, z-5), montowany w layout.tsx
- `src/components/crow/CrowAnchors.tsx` — rejestr boksów hero (hero / crowCell / heroText) dla sceny
- `src/components/crow/useCrowNarrator.ts` — jedna subskrypcja scrolla Lenisa + pomiar FPS (tier)
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
- Scroll zabiera ptaka (S1 take-off, `uTakeoff` w shaderze) — chmura ma być widoczna w pełnej opacity, NIE wygaszaj warstwy canvasu. To maska kolumnowa schodzi z drogi: `--mask-open` liczy CrowScene z własnego zegara take-offu, w tym samym miejscu co reszta zmiennych maski — nie ma już żadnych stałych powielonych w page.tsx. Take-off startuje raz, po przekroczeniu 12% wysokości hero (`TAKEOFF_AT`), trwa 1.4 s i nigdy nie leci wstecz; powrót na górę poniżej 10% (`CONDENSE_AT`) składa ptaka z powrotem przez 1.2 s starą matematyką assemble
- Canvas ptaka jest w root layoucie, nie w hero: `.crow-canvas` to `CrowStage` — fixed inset-0, z-5, pointer-events none, jeden canvas i jeden kontekst WebGL na całą sesję (przeżywa zmianę route). Pusty `.crow-cell` w gridzie hero to element pomiarowy — fit czyta jego rect, nie canvas; page.tsx tylko rejestruje boksy przez `useCrowAnchorRef`. Wszystkie pomiary są w przestrzeni viewportu. Zasięg cząsteczek ustala maska w globals.css (spill + dziura na blok tekstowy), nie overflow. Na trasach bez hero canvas zostaje, ale nic nie rysuje
- Hero text block: widoczny od razu (fade + 12px translate, 600ms, start 300ms po mount) — NIE może czekać na załadowanie sceny z ptakiem. Kontener ma pointer-events: none, tylko przycisk i link mają auto, żeby ptak dalej reagował na kursor
- prefers-reduced-motion: wyłącz animacje
- Strona musi startować od góry (scrollTo 0,0)
- Favicon: `src/app/icon.svg` + `src/app/apple-icon.png` to zwarty znak KW (Inter 900 obrysowane do ścieżek, bez <text>, bez kropki i bez separatora). Odstęp liter to 0.03em nominalnie — dobrany na złączeniu, nie z metryki: ramię K i pierwsza kreska W schodzą się najbliżej na linii wersalików, i przy 16px piksel między nimi trzyma 132/244 dla każdego odstępu do 0.026em, czyli zlewa oba kształty; przy 0.028em spada do 76/244. Nie zacieśniaj poniżej 0.03em bez ponownego sprawdzenia rastra 16px. Nie dodawać z powrotem favicon.ico, bo przejmuje pierwszeństwo

Podczas pracy nad interfejsem, animacjami lub audytem kodu, bezwzględnie stosuj zasady i wytyczne opisane w plikach Markdown znajdujących się w folderze .claude/skills/. Przeczytaj je przed wygenerowaniem komponentu.