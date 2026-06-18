"""Genera logo-viajes-peludos.png sin fondo desde image1.png"""
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "image1.png"
OUT = ROOT / "assets" / "logo-viajes-peludos.png"


def is_white(r, g, b):
    return r > 245 and g > 245 and b > 245


def is_bg(r, g, b, a):
    if a < 8:
        return True
    return is_white(r, g, b)


def main():
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    px = img.load()
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    seen = set()
    while q:
        x, y = q.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if not is_bg(r, g, b, a):
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    img.save(OUT, "PNG")
    print(f"OK {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
