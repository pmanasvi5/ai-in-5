"""Generates the AI in 5 v2 brand mark: a bold numeral 5 on an electric-blue
rounded-square tile, with a coral accent dot standing in for a speech-bubble
tail — a nod to "daily briefing" + "five stories" without resorting to
brain/robot/circuit AI cliches. Built entirely from a system font and basic
shapes, no external assets or paid services.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ELECTRIC_BLUE = (30, 70, 230, 255)   # #1E46E6 — primary accent
CORAL = (255, 107, 74, 255)          # #FF6B4A — secondary accent
CREAM = (253, 249, 242, 255)         # #FDF9F2 — warm off-white

SF_ROUNDED = "/System/Library/Fonts/SFCompactRounded.ttf"

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"
SOCIAL_DIR = Path(__file__).resolve().parent.parent / "public"
DESKTOP_DIR = Path(__file__).resolve().parent.parent / "electron" / "build"


def _rounded_font(size: int) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(SF_ROUNDED, size)
    font.set_variation_by_name("Black")
    return font


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    scale = 4  # supersample then downscale for smooth edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Maskable icons need extra "safe zone" padding since the OS may crop
    # to a circle; everything meaningful stays inside ~80% of the canvas.
    pad = s * 0.12 if maskable else 0
    corner_radius = s * 0.26
    draw.rounded_rectangle([pad, pad, s - pad, s - pad], radius=corner_radius, fill=ELECTRIC_BLUE)

    # The numeral: sized generously so it reads clearly even at 16-32px.
    font = _rounded_font(int(s * 0.62))
    glyph = "5"
    bbox = draw.textbbox((0, 0), glyph, font=font)
    gw, gh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx, cy = s / 2, s / 2
    # Nudge left/up slightly to leave room for the coral accent dot.
    tx = cx - gw / 2 - bbox[0] - s * 0.03
    ty = cy - gh / 2 - bbox[1] - s * 0.03
    draw.text((tx, ty), glyph, font=font, fill=CREAM)

    # Coral accent dot, positioned like a speech-bubble tail / spark at the
    # numeral's lower-right — the one spot of secondary color on the mark.
    dot_r = s * 0.075
    dot_cx = cx + gw * 0.30
    dot_cy = cy + gh * 0.38
    draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=CORAL)

    return img.resize((size, size), Image.LANCZOS)


def make_social_preview() -> Image.Image:
    """A 1200x630 Open Graph / social-share card: the mark plus wordmark on
    the warm off-white background, for link previews in Messages, Slack,
    X, etc."""
    w, h, scale = 1200, 630, 2
    W, H = w * scale, h * scale
    img = Image.new("RGBA", (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    tile_size = int(H * 0.42)
    tile = make_icon(tile_size * 2).resize((tile_size, tile_size), Image.LANCZOS)
    tile_x = int(W * 0.5 - tile_size / 2)
    tile_y = int(H * 0.5 - tile_size / 2 - H * 0.08)
    img.paste(tile, (tile_x, tile_y), tile)

    wordmark_font = ImageFont.truetype(SF_ROUNDED, int(H * 0.11))
    wordmark_font.set_variation_by_name("Bold")
    text = "AI in 5"
    bbox = draw.textbbox((0, 0), text, font=wordmark_font)
    tw = bbox[2] - bbox[0]
    draw.text((W / 2 - tw / 2 - bbox[0], tile_y + tile_size + H * 0.04), text, font=wordmark_font, fill=(31, 35, 40, 255))

    tagline_font = ImageFont.truetype(SF_ROUNDED, int(H * 0.045))
    tagline = "Your daily 5-minute AI catch-up"
    bbox2 = draw.textbbox((0, 0), tagline, font=tagline_font)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(
        (W / 2 - tw2 / 2 - bbox2[0], tile_y + tile_size + H * 0.04 + int(H * 0.14)),
        tagline,
        font=tagline_font,
        fill=(107, 102, 112, 255),
    )

    return img.convert("RGB").resize((w, h), Image.LANCZOS)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DESKTOP_DIR.mkdir(parents=True, exist_ok=True)

    for size in (192, 512):
        make_icon(size).save(OUT_DIR / f"icon-{size}.png")
    make_icon(512, maskable=True).save(OUT_DIR / "icon-512-maskable.png")
    make_icon(32).save(OUT_DIR / "icon-32.png")
    make_icon(180).save(OUT_DIR / "icon-180.png")  # apple-touch-icon
    print("Icons written to", OUT_DIR)

    make_social_preview().save(SOCIAL_DIR / "social-preview.png", quality=92)
    print("Social preview written to", SOCIAL_DIR / "social-preview.png")

    base = make_icon(1024)
    base.save(DESKTOP_DIR / "icon.png")
    base.save(
        DESKTOP_DIR / "icon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("Desktop icons written to", DESKTOP_DIR)


if __name__ == "__main__":
    main()
