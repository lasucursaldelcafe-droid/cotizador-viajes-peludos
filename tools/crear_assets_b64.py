"""Genera js/vp-assets-b64.js con logo y membrete embebidos (abrir HTML sin servidor)."""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "assets" / "logo-viajes-peludos.png"
FONDO = ROOT / "assets" / "image2.png"
OUT = ROOT / "js" / "vp-assets-b64.js"


def b64(path):
    data = path.read_bytes()
    mime = "image/png"
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def main():
    logo = b64(LOGO)
    fondo = b64(FONDO)
    OUT.write_text(
        "/* Auto-generado — no editar a mano */\n"
        "const VP_EMBEDDED_ASSETS = {\n"
        f"  logo: '{logo}',\n"
        f"  fondo: '{fondo}'\n"
        "};\n",
        encoding="utf-8",
    )
    print(f"OK {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
