"""Generates the AI in 5 app icons (PWA manifest + favicon) from the same
mark used in src/components/Logo.tsx: a lavender rounded tile with a
five-point spark, standing in for the five daily stories. No external
assets or paid services are used.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ACCENT = (139, 124, 232, 255)   # #8B7CE8
CREAM = (250, 249, 246, 255)    # #FAF9F6

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def spark_points(cx, cy, r_outer, r_inner):
    """Five-point spark/star polygon, same proportions as the SVG logo mark."""
    import math
    pts = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        r = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return pts


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    scale = 4  # supersample then downscale for smooth edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    corner_radius = s * (0.30 if maskable else 0.30)
    pad = s * 0.12 if maskable else 0
    draw.rounded_rectangle([pad, pad, s - pad, s - pad], radius=corner_radius, fill=ACCENT)

    cx, cy = s / 2, s / 2
    r_outer = s * 0.26
    r_inner = r_outer * 0.42
    draw.polygon(spark_points(cx, cy, r_outer, r_inner), fill=CREAM)

    return img.resize((size, size), Image.LANCZOS)


DESKTOP_DIR = Path(__file__).resolve().parent.parent / "electron" / "build"


def main():
    for size in (192, 512):
        make_icon(size).save(OUT_DIR / f"icon-{size}.png")
    make_icon(512, maskable=True).save(OUT_DIR / "icon-512-maskable.png")
    make_icon(32).save(OUT_DIR / "icon-32.png")
    make_icon(180).save(OUT_DIR / "icon-180.png")  # apple-touch-icon
    print("Icons written to", OUT_DIR)

    # Desktop app icons (electron-builder looks for electron/build/icon.png
    # and generates .icns/.ico from it, but .ico needs multiple embedded
    # sizes to look right in Windows' taskbar/Explorer, so write that
    # ourselves with Pillow; .icns is built separately via iconutil).
    DESKTOP_DIR.mkdir(parents=True, exist_ok=True)
    base = make_icon(1024)
    base.save(DESKTOP_DIR / "icon.png")
    base.save(
        DESKTOP_DIR / "icon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("Desktop icons written to", DESKTOP_DIR)


if __name__ == "__main__":
    main()
