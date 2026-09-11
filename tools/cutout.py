"""Prepare a character image for Glass Dash.

usage: python cutout.py INPUT OUTPUT.png [--model isnet-anime] [--force-rembg] [--no-trim]

If INPUT already has real transparency (e.g. a PNG exported from ChatGPT), its alpha is kept
and only cleaned up; otherwise the background is removed with rembg. The result is trimmed
to the character's bounding box so it can be positioned precisely on the glass panel.
"""
import argparse

from PIL import Image


def has_transparency(image: Image.Image) -> bool:
    if image.mode != "RGBA":
        return False
    lo, _ = image.getchannel("A").getextrema()
    return lo < 16


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--model", default="isnet-anime")
    ap.add_argument("--force-rembg", action="store_true")
    ap.add_argument("--no-trim", action="store_true")
    args = ap.parse_args()

    image = Image.open(args.input)
    image = image.convert("RGBA") if image.mode in ("RGBA", "LA", "P") else image.convert("RGB")

    if has_transparency(image) and not args.force_rembg:
        result = image
        print("using the image's own transparency")
    else:
        from rembg import new_session, remove  # heavy import, only when needed

        result = remove(image.convert("RGBA"), session=new_session(args.model))
        print(f"background removed with rembg ({args.model})")

    # Generators often leave the body at alpha 250-254 and speckles at 1-2: snap both.
    alpha = result.getchannel("A").point(lambda a: 255 if a >= 250 else (0 if a <= 2 else a))
    result.putalpha(alpha)

    if not args.no_trim:
        box = alpha.point(lambda a: 255 if a > 8 else 0).getbbox()
        if box:
            result = result.crop(box)

    result.save(args.output, optimize=True)
    print(f"{args.output}: {result.width}x{result.height}")


if __name__ == "__main__":
    main()
