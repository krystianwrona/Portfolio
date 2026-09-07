#!/usr/bin/env python3
"""
capture_adoptio.py — zrzuty Adoptio w jakości do portfolio.

Czym różni się od capture_site.py
---------------------------------
capture_site.py wycina elementy <section>. Adoptio nie jest tak zbudowane:
/search i /pet/1 mają po jednej sekcji o wysokości 0 px, a strona główna
zawiesza się na wait_for_load_state("networkidle"), bo analityka i Sentry
nigdy nie doprowadzają sieci do ciszy.

Ten skrypt zamiast tego:
  * robi zrzut CAŁEJ strony przy deviceScaleFactor=2 (viewport 1440x900 daje
    szerokość 2880 px), zapisuje PNG bezstratnie;
  * czeka na "load" plus jawny odstęp, nigdy na "networkidle";
  * przewija stronę do końca i z powrotem, żeby wymusić lazy-load zdjęć;
  * potrafi kliknąć element przed zrzutem (modal z danymi do przelewu);
  * trzyma sesję w katalogu profilu, więc panel schroniska da się sfotografować
    po jednorazowym zalogowaniu ręką.

Logowanie
---------
Skrypt NIGDY nie prosi o hasło i nigdzie go nie zapisuje. Przy --login otwiera
widoczne okno przeglądarki, zatrzymuje się i czeka, aż zalogujesz się sam.
Po naciśnięciu Enter w konsoli sesja zostaje w katalogu profilu i kolejne
uruchomienia (już bez okna) z niej korzystają.

Użycie
------
    # raz, żeby wpuścić skrypt do panelu:
    python capture_adoptio.py --login

    # strony publiczne (nie wymagają logowania):
    python capture_adoptio.py --public --out D:\\Cowork\\Portfolio\\shots

    # panel schroniska (wymaga wcześniejszego --login):
    python capture_adoptio.py --panel --out D:\\Cowork\\Portfolio\\shots

    # wszystko naraz:
    python capture_adoptio.py --public --panel --out D:\\Cowork\\Portfolio\\shots

    # widok mobilny:
    python capture_adoptio.py --mobile --out D:\\Cowork\\Portfolio\\shots
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit(
        "Brak Playwright. Zainstaluj:\n"
        "  pip install --upgrade playwright\n"
        "  python -m playwright install chromium"
    )

BASE = "https://adoptio.vercel.app"
SHELTER = "77da24d5-a1cd-4b8b-bc15-a5bf990e3fd8"

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

# Katalog profilu przeglądarki. Trzyma ciasteczka sesji po --login.
# Leży obok skryptu, czyli od teraz w repo — dlatego .gitignore go wycina.
# Nigdy go nie commituj: to żywa sesja zalogowanego konta.
PROFILE_DIR = Path(__file__).parent / ".adoptio-profile"

# name, url, tryb, opcjonalny klik przed zrzutem
# tryb: "full" = cała strona, "viewport" = pierwszy ekran
PUBLIC = [
    ("adoptio-hero",     f"{BASE}/",                        "full",     None),
    ("adoptio-search",   f"{BASE}/search",                  "full",     None),
    ("adoptio-quiz",     f"{BASE}/quiz",                    "full",     None),
    ("adoptio-pet",      f"{BASE}/pet/1",                   "full",     None),
    ("adoptio-shelter",  f"{BASE}/shelters/{SHELTER}",      "full",     None),
    ("adoptio-transfer", f"{BASE}/shelters/{SHELTER}",      "viewport", "Pokaż dane do przelewu"),
    ("adoptio-blog",     f"{BASE}/blog",                    "full",     None),
]

PANEL = [
    ("adoptio-dashboard", f"{BASE}/admin/dashboard",     "full", None),
    ("adoptio-kanban",    f"{BASE}/admin/applications",  "full", None),
]

MOBILE_SHOTS = [
    ("adoptio-mobile-hero",   f"{BASE}/",              "viewport", None),
    ("adoptio-mobile-search", f"{BASE}/search",        "viewport", None),
    ("adoptio-mobile-pet",    f"{BASE}/pet/1",         "viewport", None),
]


def prepare(page, wait_s: float) -> None:
    """Przewija stronę i czeka, aż obrazki faktycznie się zdekodują."""
    page.wait_for_load_state("load")
    page.wait_for_timeout(int(wait_s * 1000))

    height = page.evaluate("document.body.scrollHeight")
    y = 0
    while y < height:
        page.evaluate(f"window.scrollTo(0, {y})")
        page.wait_for_timeout(220)
        y += 600
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(600)

    # Czekamy na obrazki, nie na sieć — analityka nigdy nie milknie,
    # a to obrazki decydują, czy zrzut pokaże szare prostokąty.
    try:
        page.wait_for_function(
            "Array.from(document.images).every(i => i.complete)",
            timeout=15000,
        )
    except Exception:
        print("    (część obrazków nie doładowała się w 15 s — sprawdź zrzut okiem)")
    page.wait_for_timeout(400)


def shoot_one(page, out: Path, name: str, url: str, mode: str, click_label, wait_s: float) -> None:
    page.goto(url, wait_until="domcontentloaded")
    prepare(page, wait_s)

    if click_label:
        try:
            page.get_by_role("button", name=click_label).first.click()
            page.wait_for_timeout(900)
        except Exception as exc:
            print(f'  {name}: nie udalo sie kliknac "{click_label}" - {exc}')
            return

    dest = out / f"{name}.png"
    page.screenshot(path=str(dest), full_page=(mode == "full"))
    print(f"  {name}.png  ({mode})")


def run(shots, out: Path, viewport: dict, scale: int, wait_s: float, mobile: bool = False) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=True,
            viewport=viewport,
            device_scale_factor=scale,
            is_mobile=mobile,
            has_touch=mobile,
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        for name, url, mode, click_label in shots:
            shoot_one(page, out, name, url, mode, click_label, wait_s)
        ctx.close()


def login(wait_s: float) -> None:
    """Otwiera widoczne okno i czeka, aż użytkownik zaloguje się ręcznie."""
    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=False,
            viewport=DESKTOP,
            device_scale_factor=1,
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(f"{BASE}/login", wait_until="domcontentloaded")
        print()
        print("  Otworzyłem okno przeglądarki.")
        print("  Zaloguj się w nim ręcznie — skrypt nie widzi Twojego hasła")
        print("  i nigdzie go nie zapisuje.")
        print()
        input("  Gdy zobaczysz panel schroniska, wróć tu i naciśnij Enter... ")
        ctx.close()
        print("  Sesja zapisana. Kolejne uruchomienia będą już bez okna.")


def main() -> None:
    p = argparse.ArgumentParser(description="Zrzuty Adoptio do portfolio.")
    p.add_argument("--login", action="store_true", help="jednorazowe logowanie ręczne do panelu")
    p.add_argument("--public", action="store_true", help="strony publiczne")
    p.add_argument("--panel", action="store_true", help="panel schroniska (wymaga --login)")
    p.add_argument("--mobile", action="store_true", help="widoki mobilne")
    p.add_argument("--out", type=Path, default=Path("./shots"))
    p.add_argument("--wait", type=float, default=3.0, help="sekundy na doładowanie (default 3)")
    args = p.parse_args()

    if not any([args.login, args.public, args.panel, args.mobile]):
        p.error("Podaj co najmniej jedno: --login, --public, --panel, --mobile")

    if args.login:
        login(args.wait)

    if args.public:
        print("\nStrony publiczne:")
        run(PUBLIC, args.out, DESKTOP, 2, args.wait)

    if args.panel:
        if not PROFILE_DIR.exists():
            sys.exit("Brak sesji. Najpierw: python capture_adoptio.py --login")
        print("\nPanel schroniska:")
        run(PANEL, args.out, DESKTOP, 2, args.wait)

    if args.mobile:
        print("\nWidoki mobilne:")
        run(MOBILE_SHOTS, args.out, MOBILE, 3, args.wait, mobile=True)

    if args.public or args.panel or args.mobile:
        print(f"\nGotowe. Pliki w: {args.out.resolve()}\n")


if __name__ == "__main__":
    main()
