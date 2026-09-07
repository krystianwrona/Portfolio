#!/usr/bin/env python3
"""
frame_screens.py — lekka oprawa screenów do case studies.

Trzy tryby:
  browser  — cienki pasek przeglądarki (kropki + opcjonalny pasek adresu),
             zaokrąglone rogi, subtelna ramka i cień.
  phone    — prosty bezel telefonu (bez notcha), zaokrąglone rogi, cień.
  laptop   — ciemne okno przeglądarki na podstawce szerszej od okna, bez
             cienia. Odtwarza oprawę, z którą przyszły screeny FashionHero
             (proporcje zmierzone z fashionhero-*.png — patrz LAPTOP niżej).

Celowo minimalistyczne: ramka zabiera kilka procent kadru, nie trzydzieści,
więc gęste dashboardy zostają czytelne.

Wymaga: Pillow >= 9.4  (pip install --upgrade Pillow)

Przykłady
---------
# cztery desktopowe screeny FashionHero
python frame_screens.py browser public/fashionhero-dashboard.png \
                                public/fashionhero-promote.png \
                                public/fashionhero-catalog.png \
                                public/fashionhero-analytics.png \
       --suffix "" --inplace

# mobile
python frame_screens.py phone public/fashionhero-mobile.png --inplace

# oprawa laptopowa (jak FashionHero) — surowy zrzut bez własnego chrome
python frame_screens.py laptop shots/adoptio-hero.png --inplace

# podgląd bez nadpisywania (zapisze *-framed.png obok)
python frame_screens.py browser public/fashionhero-dashboard.png
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw, ImageFilter
except ImportError:  # pragma: no cover
    sys.exit("Brak Pillow. Zainstaluj: pip install --upgrade Pillow")


# ---------------------------------------------------------------- motywy

THEMES = {
    "dark": {
        "chrome": (38, 38, 40),
        "border": (255, 255, 255, 28),
        "pill": (58, 58, 61),
        "dots": [(255, 95, 86), (255, 189, 46), (39, 201, 63)],
    },
    "light": {
        "chrome": (232, 232, 234),
        "border": (0, 0, 0, 26),
        "pill": (250, 250, 250),
        "dots": [(255, 95, 86), (255, 189, 46), (39, 201, 63)],
    },
    "mono": {  # neutralne, bez kolorowych kropek — spójne z czarno-białą estetyką
        "chrome": (38, 38, 40),
        "border": (255, 255, 255, 28),
        "pill": (58, 58, 61),
        "dots": [(110, 110, 114)] * 3,
    },
    "laptop": {  # kolory odpipetkowane z fashionhero-*.png
        "chrome": (42, 42, 42),
        "base": (58, 58, 58),
        "border": (255, 255, 255, 28),  # nieużywane w trybie laptop
        "pill": (58, 58, 61),
        "dots": [(255, 95, 86), (255, 189, 46), (39, 201, 63)],
    },
}

# Proporcje oprawy laptopowej, wszystkie względem szerokości okna W.
# Zmierzone z fashionhero-dashboard.png, gdzie W = 2000 px:
#   pasek 68, podbródek 36, podstawka 16 wys. i 2200 szer. (po 100 z każdej
#   strony), promienie 20 / 4 / 16, kropki ⌀20 co 32 od x=42, margines 80 na
#   boki oraz 116 u góry i 114 u dołu.
# Dzięki temu ta sama bryła skaluje się na 2850 (Ania) i 2880 (Adoptio).
LAPTOP = {
    "bar":       0.0340,   # wysokość paska z kropkami
    "chin":      0.0180,   # ciemny pas pod screenem
    "base":      0.0080,   # wysokość podstawki
    "overhang":  0.0500,   # o ile podstawka wystaje z każdej strony
    "r_top":     0.0100,   # zaokrąglenie górnych rogów okna
    "r_bottom":  0.0020,   # dolne rogi okna — prawie kwadratowe
    "r_base":    0.0080,   # dolne rogi podstawki
    "dot_r":     0.0050,
    "dot_x":     0.0210,   # środek pierwszej kropki od lewej krawędzi okna
    "dot_step":  0.0160,
    "pad_x":      0.0400,
    "pad_top":    0.0580,  # oryginał sadza bryłę o piksel niżej niż środek
    "pad_bottom": 0.0570,
}


# ---------------------------------------------------------------- helpers


def _rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255
    )
    return mask


def _window_mask(size: tuple[int, int], r_top: int, r_bottom: int) -> Image.Image:
    """Prostokąt z osobnym promieniem górnych i dolnych rogów.

    Pillow przyjmuje jeden promień na całą bryłę, więc składamy przecięcie
    dwóch masek: każda ścina tylko swoją parę rogów.
    """
    box = [0, 0, size[0] - 1, size[1] - 1]

    top = Image.new("L", size, 0)
    ImageDraw.Draw(top).rounded_rectangle(
        box, radius=r_top, fill=255, corners=(True, True, False, False)
    )
    bottom = Image.new("L", size, 0)
    ImageDraw.Draw(bottom).rounded_rectangle(
        box, radius=r_bottom, fill=255, corners=(False, False, True, True)
    )
    return ImageChops.darker(top, bottom)


def _with_shadow(
    card: Image.Image,
    blur: int,
    offset_y: int,
    opacity: int,
    pad: int,
) -> Image.Image:
    """Podkłada miękki cień pod gotową (już zaokrągloną) kartę RGBA."""
    w, h = card.size
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow.paste(
        Image.new("RGBA", card.size, (0, 0, 0, opacity)),
        (pad, pad + offset_y),
        card.split()[3],
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))

    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(card, (pad, pad), card)
    return canvas


def _finish(card: Image.Image, radius: int, theme: dict, shadow: bool) -> Image.Image:
    """Zaokrągla rogi, dokłada hairline border i (opcjonalnie) cień."""
    card = card.convert("RGBA")
    card.putalpha(_rounded_mask(card.size, radius))

    border = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(border).rounded_rectangle(
        [0, 0, card.size[0] - 1, card.size[1] - 1],
        radius=radius,
        outline=theme["border"],
        width=max(1, round(card.size[0] * 0.0012)),
    )
    card = Image.alpha_composite(card, border)

    if shadow:
        w = card.size[0]
        card = _with_shadow(
            card,
            blur=max(12, round(w * 0.016)),
            offset_y=max(6, round(w * 0.008)),
            opacity=90,
            pad=max(30, round(w * 0.05)),
        )
    return card


# ---------------------------------------------------------------- tryby


def browser_chrome(
    img: Image.Image,
    theme: dict,
    url_pill: bool = True,
    shadow: bool = True,
) -> Image.Image:
    img = img.convert("RGB")
    w, h = img.size

    bar_h = max(30, round(w * 0.030))
    radius = max(10, round(w * 0.013))

    card = Image.new("RGB", (w, h + bar_h), theme["chrome"])
    card.paste(img, (0, bar_h))

    d = ImageDraw.Draw(card)

    # kropki
    r = max(3, round(bar_h * 0.17))
    cx = round(bar_h * 0.62)
    cy = bar_h // 2
    for color in theme["dots"]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
        cx += round(r * 3.2)

    # pasek adresu — pusty, celowo bez tekstu (żeby nie zdradzać localhost itp.)
    if url_pill:
        pill_w = round(w * 0.30)
        pill_h = round(bar_h * 0.52)
        x0 = (w - pill_w) // 2
        y0 = (bar_h - pill_h) // 2
        d.rounded_rectangle(
            [x0, y0, x0 + pill_w, y0 + pill_h],
            radius=pill_h // 2,
            fill=theme["pill"],
        )

    return _finish(card, radius, theme, shadow)


def phone_frame(
    img: Image.Image,
    theme: dict,
    shadow: bool = True,
) -> Image.Image:
    img = img.convert("RGB")
    w, h = img.size

    bezel = max(10, round(w * 0.030))
    inner_r = max(14, round(w * 0.055))
    outer_r = inner_r + bezel

    # ekran z własnym zaokrągleniem
    screen = img.convert("RGBA")
    screen.putalpha(_rounded_mask(screen.size, inner_r))

    body = Image.new("RGBA", (w + bezel * 2, h + bezel * 2), (20, 20, 22, 255))
    body.paste(screen, (bezel, bezel), screen)

    return _finish(body, outer_r, theme, shadow)


def laptop_frame(img: Image.Image, theme: dict) -> Image.Image:
    """Ciemne okno na podstawce szerszej od okna — oprawa FashionHero.

    Screen wypełnia okno na całą szerokość: po bokach nie ma bezela, ramkę
    robią tylko pasek z kropkami u góry i podbródek u dołu. Cienia nie ma
    (oryginał też go nie miał), więc PNG zostaje czysto przezroczysty.
    """
    img = img.convert("RGB")
    w, h = img.size
    k = LAPTOP

    def px(name: str, floor: int = 1) -> int:
        return max(floor, round(w * k[name]))

    bar, chin = px("bar"), px("chin")
    base_h, overhang = px("base"), px("overhang")
    dot_r, dot_step = px("dot_r", 2), px("dot_step", 2)
    dot_x = px("dot_x", 3)

    # okno: pasek + screen + podbródek
    win_h = bar + h + chin
    window = Image.new("RGB", (w, win_h), theme["chrome"])
    window.paste(img, (0, bar))

    d = ImageDraw.Draw(window)
    cx, cy = dot_x, bar // 2
    for color in theme["dots"]:
        # prawy/dolny kraniec o piksel mniej: ImageDraw liczy zakres domknięty,
        # a kropka w oryginale ma równe 2r, nie 2r+1
        d.ellipse([cx - dot_r, cy - dot_r, cx + dot_r - 1, cy + dot_r - 1], fill=color)
        cx += dot_step

    window = window.convert("RGBA")
    window.putalpha(_window_mask(window.size, px("r_top"), px("r_bottom")))

    # podstawka: szersza od okna, dolne rogi zaokrąglone
    base_w = w + overhang * 2
    base = Image.new("RGBA", (base_w, base_h), (0, 0, 0, 0))
    ImageDraw.Draw(base).rounded_rectangle(
        [0, 0, base_w - 1, base_h - 1],
        radius=px("r_base"),
        fill=theme["base"],
        corners=(False, False, True, True),
    )

    pad_x = px("pad_x")
    pad_top, pad_bottom = px("pad_top"), px("pad_bottom")
    canvas = Image.new(
        "RGBA",
        (base_w + pad_x * 2, win_h + base_h + pad_top + pad_bottom),
        (0, 0, 0, 0),
    )
    canvas.paste(window, (pad_x + overhang, pad_top), window)
    canvas.paste(base, (pad_x, pad_top + win_h), base)
    return canvas


# ---------------------------------------------------------------- CLI


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("mode", choices=["browser", "phone", "laptop"])
    p.add_argument("files", nargs="+", type=Path)
    p.add_argument(
        "--theme",
        choices=list(THEMES),
        default=None,
        help="domyślnie: laptop dla trybu laptop, dark dla pozostałych",
    )
    p.add_argument("--suffix", default="-framed", help="dopisek w nazwie pliku wyjściowego")
    p.add_argument("--inplace", action="store_true", help="nadpisz plik źródłowy")
    p.add_argument("--no-shadow", action="store_true")
    p.add_argument("--no-url", action="store_true", help="bez paska adresu (tylko kropki)")
    args = p.parse_args()

    theme = THEMES[args.theme or ("laptop" if args.mode == "laptop" else "dark")]

    for path in args.files:
        if not path.exists():
            print(f"  pominięto (brak pliku): {path}")
            continue

        with Image.open(path) as src:
            if args.mode == "browser":
                out = browser_chrome(
                    src, theme, url_pill=not args.no_url, shadow=not args.no_shadow
                )
            elif args.mode == "laptop":
                out = laptop_frame(src, theme)
            else:
                out = phone_frame(src, theme, shadow=not args.no_shadow)

        dest = path if args.inplace else path.with_name(f"{path.stem}{args.suffix}{path.suffix}")
        if dest.suffix.lower() in {".jpg", ".jpeg"}:
            dest = dest.with_suffix(".png")  # cień wymaga alfy

        out.save(dest)
        print(f"  {path.name} -> {dest.name}  ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    main()
