"""Draws the extras for Felix the Photographer's winner photo after a boss fight:
the camera flash burst and the instant-photo frame the game fills with the winning moment.

Same rules as world_art.py: drawn at the hero's pixel size (twice the world resolution), #150b22 outline.
Felix's own poses (idle, walk, shoot) come from Higgsfield, see /mnt/project-files/art/felix/README.md.

Outputs (default /mnt/project-files/art/felix, or the folder given as the first argument):
  flash-0.png, flash-1.png   24 x 24 starburst on the camera's flash: big, then fading
  photo-frame.png            the instant photo: white border, thicker at the bottom, dark window
                             where the game draws the snapshot (PHOTO_WINDOW)

Run from the repo root:  python3 tools/felix_art.py [out_dir]   (needs Pillow and numpy)
"""
import os
import sys
import numpy as np
from pixelkit import Canvas, OUTLINE
from intro_art import put, outline_of, frame, GILT

WHITE = ['#cfcdcd', '#ecebeb', '#fdfefd']
GLOW = '#fff4cc'


def flash(big):
    """A four-point starburst with short diagonals, hot white core."""
    c = Canvas(24, 24)
    cx = cy = 12
    arm = 11 if big else 6
    diag = 6 if big else 3
    for i in range(-arm, arm + 1):
        t = 1 if abs(i) < arm * 0.5 else 0
        c.rect(cx + i, cy - t, 1, 1 + 2 * t, GLOW if abs(i) > arm * 0.7 else WHITE[2])
        c.rect(cx - t, cy + i, 1 + 2 * t, 1, GLOW if abs(i) > arm * 0.7 else WHITE[2])
    for i in range(-diag, diag + 1):
        c.px(cx + i, cy + i, GLOW); c.px(cx + i, cy - i, GLOW)
    core = c.ellipse_mask(cx + 0.5, cy + 0.5, 3 if big else 2, 3 if big else 2)
    c.fill(core, WHITE[2])
    return c


PHOTO_WINDOW = (8, 8, 160, 112)       # window inside the card; on photo-frame.png it sits 1 px further in (9, 9) because of the outline


def photo_frame():
    """An instant photo: off-white card with a wide bottom strip, a dark window and a small gold star sticker."""
    x, y, w, h = PHOTO_WINDOW
    W, H = w + 2 * x, h + y + 30
    c = Canvas(W, H)
    card = np.ones((H, W), bool)
    ys, xs = np.mgrid[0:H, 0:W]
    put(c, card, WHITE[1])
    put(c, (xs < 2) | (ys < 2), WHITE[2])                                  # lit top and left
    put(c, (xs >= W - 2) | (ys >= H - 2), WHITE[0])                        # shade bottom and right
    put(c, (xs >= x) & (xs < x + w) & (ys >= y) & (ys < y + h), '#221533')  # the window
    frame(c, x - 1, y - 1, w + 2, h + 2, WHITE[0])
    # A little gold star sticker in the bottom-right of the strip.
    sx, sy = W - 20, y + h + 15
    for r, col in ((5, GILT[1]), (3, GILT[2])):
        for i in range(-r, r + 1):
            c.px(sx + i, sy, col); c.px(sx, sy + i, col)
        for i in range(-r // 2, r // 2 + 1):
            c.px(sx + i, sy + i, col); c.px(sx + i, sy - i, col)
    c.px(sx, sy, GILT[3])
    outline_of(c, card | (c.a[..., 3] > 0))
    out = Canvas(W + 2, H + 2)
    out.a[1:-1, 1:-1] = c.a
    out.outline()
    return out


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art/felix'
    os.makedirs(out, exist_ok=True)
    flash(True).save(os.path.join(out, 'flash-0.png'))
    flash(False).save(os.path.join(out, 'flash-1.png'))
    photo_frame().save(os.path.join(out, 'photo-frame.png'))
    print('saved to', out)


if __name__ == '__main__':
    main()
