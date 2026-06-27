#!/usr/bin/env python3
"""Remove backgrounds and crop images to content bounds."""

from __future__ import annotations

from pathlib import Path

from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parent.parent
IMAGE_DIRS = [
    ROOT / "assets/images/brand",
    ROOT / "assets/images/products",
]

SKIP = {"logo-sucursal-cafe.svg"}


def crop_to_alpha(img: Image.Image, padding: int = 12) -> Image.Image:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(img.width, right + padding)
    bottom = min(img.height, bottom + padding)
    return img.crop((left, top, right, bottom))


def remove_near_black(img: Image.Image, threshold: int = 40) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (r, g, b, 0)
    return crop_to_alpha(img)


def process_image(path: Path) -> None:
    if path.name in SKIP or path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        return
    print(f"Processing {path.relative_to(ROOT)}")
    is_logo = "logo" in path.name
    if is_logo:
        img = Image.open(path).convert("RGBA")
        img = remove_near_black(img)
    else:
        raw = path.read_bytes()
        result = remove(raw)
        img = Image.open(__import__("io").BytesIO(result)).convert("RGBA")
        img = crop_to_alpha(img)
    img.save(path, "PNG", optimize=True)
    print(f"  -> {img.size[0]}x{img.size[1]} RGBA")


def main() -> None:
    for directory in IMAGE_DIRS:
        if not directory.exists():
            continue
        for path in sorted(directory.glob("*")):
            process_image(path)


if __name__ == "__main__":
    main()
