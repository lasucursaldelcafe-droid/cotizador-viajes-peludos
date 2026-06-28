#!/usr/bin/env python3
"""Descubre la mejor foto de tienda entre fuentes locales conocidas."""

from __future__ import annotations

import io
import os
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
INCOMING = ROOT / "assets/images/brand/incoming/tienda.jpg"
UPLOADS = Path.home() / ".cursor/projects/workspace/uploads"
ARTIFACTS = Path("/opt/cursor/artifacts/assets")
DEST = ROOT / "assets/images/brand/tienda-real.jpg"


def score_interior(img: Image.Image) -> float:
    """Mayor puntaje = más parecido a interior industrial oscuro con patio verde."""
    im = img.convert("RGB")
    w, h = im.size
    if w < 900 or h < 500:
        return -1.0
    ratio = w / h
    if ratio < 1.25:
        return -1.0

    samples: list[tuple[int, int, int]] = []
    for x in range(0, w, max(1, w // 16)):
        for y in range(0, h, max(1, h // 12)):
            samples.append(im.getpixel((x, y)))

    avg = sum(sum(px) / 3 for px in samples) / len(samples)
    if avg > 175:
        return -1.0

    dark = sum(1 for r, g, b in samples if (r + g + b) / 3 < 70) / len(samples)
    amber = sum(
        1 for r, g, b in samples if r > 90 and g > 60 and b < 90 and r > b + 15
    ) / len(samples)

    # verde en tercio derecho (patio)
    right: list[tuple[int, int, int]] = []
    for x in range(int(w * 0.55), w, max(1, w // 20)):
        for y in range(int(h * 0.2), h, max(1, h // 16)):
            right.append(im.getpixel((x, y)))
    green = sum(1 for r, g, b in right if g > r + 12 and g > b + 12) / max(len(right), 1)

    wood_left = 0
    left: list[tuple[int, int, int]] = []
    for x in range(0, int(w * 0.45), max(1, w // 20)):
        for y in range(int(h * 0.35), h, max(1, h // 16)):
            left.append(im.getpixel((x, y)))
    wood_left = sum(
        1 for r, g, b in left if r > 55 and g > 35 and b < 70 and r > g > b
    ) / max(len(left), 1)

    # penalizar logos/documentos cuadrados claros
    if ratio < 1.4 and avg < 40 and green < 0.02:
        return -1.0

    size_bonus = min(w, 1920) / 1920
    return dark * 2.2 + green * 3.5 + amber * 1.5 + wood_left * 1.2 + size_bonus * 0.8 - (avg / 255) * 0.5


def iter_candidates() -> list[Path]:
    paths: list[Path] = []
    priority = [
        INCOMING,
        ARTIFACTS / "tienda-interior-ghost.jpg",
        ROOT / "assets/images/brand/incoming/tienda.png",
        ROOT / "assets/images/brand/incoming/tienda.jpeg",
        ROOT / "assets/images/brand/incoming/tienda.webp",
    ]
    for p in priority:
        if p.is_file():
            paths.append(p)

    globs = [
        UPLOADS / "*",
        ARTIFACTS / "*",
        ROOT / "assets/images/brand/incoming/*",
    ]
    for base in globs:
        parent = base.parent
        pattern = base.name
        if not parent.exists():
            continue
        for p in sorted(parent.glob(pattern)):
            if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"} and p not in paths:
                paths.append(p)

    return paths


def extract_pdf_jpegs() -> list[Path]:
    out_dir = Path("/tmp/ghost-tienda-pdf")
    out_dir.mkdir(parents=True, exist_ok=True)
    found: list[Path] = []
    if not UPLOADS.exists():
        return found

    for pdf in UPLOADS.glob("*.pdf"):
        data = pdf.read_bytes()
        i = 0
        idx = 0
        while True:
            start = data.find(b"\xff\xd8\xff", i)
            if start == -1:
                break
            end = data.find(b"\xff\xd9", start + 2)
            if end == -1:
                break
            chunk = data[start : end + 2]
            if len(chunk) > 80_000:
                dest = out_dir / f"{pdf.stem}-{idx}.jpg"
                if not dest.exists():
                    dest.write_bytes(chunk)
                found.append(dest)
                idx += 1
            i = end + 2
    return found


def pick_best() -> Path | None:
    candidates = iter_candidates() + extract_pdf_jpegs()
    best: tuple[float, Path] | None = None
    for path in candidates:
        try:
            img = Image.open(path)
            s = score_interior(img)
            if s < 0:
                continue
            if best is None or s > best[0]:
                best = (s, path)
        except Exception:
            continue
    return best[1] if best else None


def optimize(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGB")
    max_w = 1920
    if im.width > max_w:
        h = int(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=88, optimize=True)
    print(f"OK {dest} <= {src} ({im.width}x{im.height})")


def main() -> int:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else pick_best()
    if src is None or not src.is_file():
        print("No se encontró candidato de foto de tienda.", file=sys.stderr)
        return 1
    optimize(src, DEST)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
