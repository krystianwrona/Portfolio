#!/usr/bin/env python3
"""
capture_site.py — zrzuty sekcji żywej strony w jakości nadającej się do portfolio.

Renderuje stronę w Playwright przy deviceScaleFactor=2, więc viewport 1440x900
daje pliki 2880x1800 — porównywalne z resztą case studies (~2360x1600).

Instalacja
----------
    pip install --upgrade playwright
    playwright install chromium

Użycie
------
1) Najpierw zobacz, jakie sekcje ma strona i pod jakimi indeksami:

    python capture_site.py https://aniakampania.pl --list

2) Potem zrób zrzuty wybranych sekcji (indeksy z kroku 1) i nadaj im nazwy:

    python capture_site.py https://aniakampania.pl --shoot \
        0:ania-hero 2:ania-manifest 3:ania-gallery 4:ania-packages 5:ania-booking \
        --out ./public

3) Widok mobilny (cała strona lub pierwszy ekran):

    python capture_site.py https://aniakampania.pl --mobile ania-mobile --out ./public

Uwagi
-----
* --wait daje czas na lazy-loading zdjęć i widgetów zewnętrznych (Cal.eu itp.).
  Jeśli coś się nie doładowuje, zwiększ do 8-10 sekund.
* Skrypt przewija całą stronę przed zrzutem, żeby wymusić lazy-load obrazków.
* Zrzuty sekcji są przycięte do elementu <section>, bez paska przeglądarki —
  zgodnie z ustaloną zasadą, że oprawa dobierana jest osobno per projekt.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover
    sys.exit("Brak Playwright. Zainstaluj:\n  pip install --upgrade playwright\n  playwright install chromium")


DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}


def _prepare(page, wait_s: float) -> None:
    """Przewija stronę do końca i z powrotem, żeby wymusić lazy-load."""
    page.wait_for_load_state("networkidle")
    height = page.evaluate("document.body.scrollHeight")
    step = 600
    y = 0
    while y < height:
        page.evaluate(f"window.scrollTo(0, {y})")
        page.wait_for_timeout(180)
        y += step
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(int(wait_s * 1000))


def list_sections(url: str, wait_s: float) -> None:
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport=DESKTOP, device_scale_factor=1)
        page.goto(url, wait_until="domcontentloaded")
        _prepare(page, wait_s)

        sections = page.locator("section")
        count = sections.count()
        if count == 0:
            print("Nie znaleziono elementów <section>. Sprawdź strukturę strony.")
            browser.close()
            return

        print(f"\nZnaleziono {count} sekcji:\n")
        for i in range(count):
            s = sections.nth(i)
            try:
                box = s.bounding_box() or {}
                heading = s.locator("h1, h2, h3").first
                label = heading.inner_text(timeout=800).strip().replace("\n", " ")[:60] if heading.count() else "(bez nagłówka)"
            except Exception:
                label = "(nie udało się odczytać)"
                box = {}
            h = round(box.get("height", 0))
            print(f"  [{i:>2}]  h={h:>5}px   {label}")
        print()
        browser.close()


def shoot(url: str, targets: list[tuple[int, str]], out: Path, wait_s: float) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport=DESKTOP, device_scale_factor=2)
        page.goto(url, wait_until="domcontentloaded")
        _prepare(page, wait_s)

        sections = page.locator("section")
        for idx, name in targets:
            dest = out / f"{name}.png"
            try:
                sections.nth(idx).screenshot(path=str(dest))
                print(f"  [{idx}] -> {dest.name}")
            except Exception as exc:
                print(f"  [{idx}] BŁĄD: {exc}")
        browser.close()


def shoot_mobile(url: str, name: str, out: Path, wait_s: float, full: bool) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(
            viewport=MOBILE, device_scale_factor=3, is_mobile=True, has_touch=True
        )
        page.goto(url, wait_until="domcontentloaded")
        _prepare(page, wait_s)
        dest = out / f"{name}.png"
        page.screenshot(path=str(dest), full_page=full)
        print(f"  mobile -> {dest.name}")
        browser.close()


def main() -> None:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    p.add_argument("url")
    p.add_argument("--list", action="store_true", help="wypisz sekcje z indeksami")
    p.add_argument("--shoot", nargs="+", metavar="IDX:NAZWA", help="np. 0:ania-hero 3:ania-gallery")
    p.add_argument("--mobile", metavar="NAZWA", help="zrzut widoku mobilnego")
    p.add_argument("--full-page", action="store_true", help="mobile: cała strona zamiast pierwszego ekranu")
    p.add_argument("--out", type=Path, default=Path("./public"))
    p.add_argument("--wait", type=float, default=4.0, help="sekundy na doładowanie (default 4)")
    args = p.parse_args()

    if args.list:
        list_sections(args.url, args.wait)
        return

    if args.shoot:
        targets = []
        for item in args.shoot:
            if ":" not in item:
                sys.exit(f"Zły format: {item!r} — oczekiwano IDX:NAZWA")
            idx, name = item.split(":", 1)
            targets.append((int(idx), name))
        shoot(args.url, targets, args.out, args.wait)

    if args.mobile:
        shoot_mobile(args.url, args.mobile, args.out, args.wait, args.full_page)

    if not (args.shoot or args.mobile):
        p.print_help()


if __name__ == "__main__":
    main()
