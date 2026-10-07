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
- `src/lib/contact.ts` — logika formularza kontaktowego (walidacja, honeypot, sprawdzanie wyniku Resend); testy w `tests/contact.test.mts` (`npm test`)
- `src/lib/useLightboxDialog.ts` — wspólna obsługa klawiatury/fokusu/blokady przewijania lightboxów case studies
- Rate limit formularza to reguła Vercel WAF, nie kod — instrukcja w README
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
- Scroll rozsypuje ptaka (uScroll w shaderze) — chmura ma być widoczna w pełnej opacity, NIE wygaszaj warstwy canvasu. To maska kolumnowa schodzi z drogi: `crowMaskOpen()` w page.tsx powiela stałe eksplozji z shadera i liczy z nich `--mask-open` (0 → 1), a stopy rampy skalują się do zera. Zmiana stałych w shaderze wymaga zmiany w page.tsx
- Canvas ptaka pokrywa całą sekcję hero (`.crow-canvas`, absolute inset-0). Pusty `.crow-cell` w gridzie to element pomiarowy — fit czyta jego rect, nie canvas. Zasięg cząsteczek ustala maska w globals.css (spill + dziura na blok tekstowy), nie overflow
- Canvas ptaka ma `frameloop="demand"`: rysuje w sposób ciągły tylko, gdy hero jest w widoku (IntersectionObserver na canvasie); pod reduced motion tylko do wyrównania `uScroll`. Budzą go scroll, powrót karty i wejście hero w widok. Awaria WebGL jest łapana granicą błędów w `CrowScene.tsx` — ptak się nie rysuje, reszta strony działa
- Produkcyjna wrona to wersja z `bc89142`. Wersja preview (trwała scena w layoucie, odlot S1 — commit `953bd53`) i prototyp nowej wrony leżą w `git stash` — nie przywracać bez decyzji autora
- Hero text block: widoczny od razu (fade + 12px translate, 600ms, start 300ms po mount) — NIE może czekać na załadowanie sceny z ptakiem. Kontener ma pointer-events: none, tylko przycisk i link mają auto, żeby ptak dalej reagował na kursor
- prefers-reduced-motion: wyłącz animacje
- Strona musi startować od góry (scrollTo 0,0)
- Blokada przewijania (`body.style.overflow`): zakładaj ją tylko, gdy coś jest otwarte, i zdejmuj w cleanupie. Nigdy nie zapisuj `""` w stanie zamkniętym — taki zapis przy montowaniu zdejmował blokadę preloadera
- Wiersze projektów na homepage to prawdziwe linki (`Link` z href); animowane wyjście przechwytuje tylko zwykłe kliknięcie lewym przyciskiem bez modyfikatorów
- Favicon: `src/app/icon.svg` + `src/app/apple-icon.png` to zwarty znak KW (Inter 900 obrysowane do ścieżek, bez <text>, bez kropki i bez separatora). Odstęp liter to 0.03em nominalnie — dobrany na złączeniu, nie z metryki: ramię K i pierwsza kreska W schodzą się najbliżej na linii wersalików, i przy 16px piksel między nimi trzyma 132/244 dla każdego odstępu do 0.026em, czyli zlewa oba kształty; przy 0.028em spada do 76/244. Nie zacieśniaj poniżej 0.03em bez ponownego sprawdzenia rastra 16px. Nie dodawać z powrotem favicon.ico, bo przejmuje pierwszeństwo

Podczas pracy nad interfejsem, animacjami lub audytem kodu, bezwzględnie stosuj zasady i wytyczne opisane w plikach Markdown znajdujących się w folderze .claude/skills/. Przeczytaj je przed wygenerowaniem komponentu.