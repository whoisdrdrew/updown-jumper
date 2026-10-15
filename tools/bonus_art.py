"""Draws the duck bonus room: the VIP door that leads in, the music and timer buttons, the start-timer
popup, the lounge backdrop, the trampoline floor and the gold frame for the big boss portrait.

Same rules as world_art.py: drawn at the hero's pixel size (twice the world resolution), #150b22
outline, 3-step ramps lit from the top left; backdrops a little calmer than the sprites.

Outputs (default /mnt/project-files/art/bonus, or the folder given as the first argument):
  vip-door.png / vip-door-open.png    52 x 84, the door with its pink VIP sign, stands on a step
  button-music.png / -pressed.png     32 x 48 pedestal with a big dome button, note icon, MUSIC
  button-timer.png / -pressed.png     32 x 48, clock icon, TIMER
  popup-timer.png                     232 x 88 panel; the game writes the question in TEXT box
  lounge.png                          640 x 360 wall, tiles left to right
  trampoline-0.png / trampoline-1.png 32 x 32 floor tile, resting and squashed (tiles left to right)
  portrait-frame.png                  gold frame, sized for the big portrait (see FRAME_*)

Run from the repo root:  python3 tools/bonus_art.py [out_dir]   (needs Pillow and numpy)
"""
import os
import sys
import numpy as np
from pixelkit import Canvas, OUTLINE, rgb
from intro_art import put, box, frame, outline_of, shade_mask, GILT, VELVET, UI_FILL

PURPLE = ['#150b22', '#221533', '#30233f', '#452c3b']             # lounge wall, dark .. lit
NEON = ['#a83a6a', '#f05a9a', '#ffb8d8', '#fff0f8']               # pink neon, glow .. hot core
DOOR = ['#1a0c10', '#2a140e', '#4e2a16', '#7a4a24']
RED = ['#6a0a20', '#a81a2a', '#d8303a', '#f05a5a']
TEAL = ['#123a4a', '#1e6a7a', '#3ca8b4', '#9ae8e8']
STEEL = ['#4a3a4e', '#6f6379', '#a396a6', '#cfcdcd']
WHITE = '#fdfefd'

GLYPHS = {   # 3 x 5 pixel letters for the button plates
    'M': ['#.#', '###', '###', '#.#', '#.#'], 'U': ['#.#', '#.#', '#.#', '#.#', '###'],
    'S': ['###', '#..', '###', '..#', '###'], 'I': ['###', '.#.', '.#.', '.#.', '###'],
    'C': ['###', '#..', '#..', '#..', '###'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'],
    'E': ['###', '#..', '##.', '#..', '###'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'],
    'V': ['#.#', '#.#', '#.#', '#.#', '.#.'], 'P': ['##.', '#.#', '##.', '#..', '#..'],
}


def text(c, s, x, y, col, scale=1):
    for ch in s:
        for gy, row in enumerate(GLYPHS[ch]):
            for gx, v in enumerate(row):
                if v == '#':
                    c.rect(x + gx * scale, y + gy * scale, scale, scale, col)
        x += 4 * scale


# ---------- the VIP door ----------

def vip_door(open_):
    """A dark club door in a gold frame with brass studs, under a pink neon VIP sign."""
    w, h = 52, 84
    c = Canvas(w, h)
    # Neon sign: a dark plate with VIP in pink tubes and a soft glow.
    c.rect(6, 1, 40, 18, UI_FILL); frame(c, 6, 1, 40, 18, OUTLINE)
    ys, xs = np.mgrid[0:h, 0:w]
    tubes = Canvas(w, h)
    text(tubes, 'VIP', 13, 4, NEON[2], scale=2)
    lit = tubes.a[..., 3] > 0
    glow = np.zeros_like(lit)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            glow |= np.roll(np.roll(lit, dy, 0), dx, 1)
    put(c, glow & ~lit & (ys > 1) & (ys < 18) & (xs > 6) & (xs < 45), NEON[0])
    put(c, lit, NEON[2])
    put(c, lit & ((xs + ys) % 5 == 0), NEON[3])
    # Gold frame round the door.
    fx, fy, fw, fh = 4, 22, 44, 62
    box(c, fx, fy, fw, fh, GILT, outline=True)
    c.rect(fx + 3, fy + 3, fw - 6, fh - 3, OUTLINE)
    dx0, dy0, dw, dh = fx + 4, fy + 4, fw - 8, fh - 4
    if open_:
        # Inside: warm purple light falling out of the room, a bit of the lounge's gold stripe.
        inside = (ys >= dy0) & (ys < dy0 + dh) & (xs >= dx0) & (xs < dx0 + dw)
        put(c, inside, PURPLE[1])
        put(c, inside & (ys < dy0 + 20), PURPLE[2])
        c.rect(dx0, dy0 + 20, dw, 1, GILT[1])
        light = inside & (ys > dy0 + dh - 22) & (np.abs(xs - (dx0 + dw / 2)) < (ys - (dy0 + dh - 22)) * 0.6 + 6)
        put(c, light, NEON[0]); put(c, light & (ys > dy0 + dh - 8), NEON[1])
        # The door swung inward: a thin dark sliver on the left.
        c.rect(dx0, dy0, 4, dh, DOOR[1]); c.rect(dx0 + 4, dy0, 1, dh, OUTLINE)
    else:
        # Two padded leather panels (tufted), brass studs, a round porthole and a gold handle.
        shade_mask(c, (ys >= dy0) & (ys < dy0 + dh) & (xs >= dx0) & (xs < dx0 + dw), DOOR[1:],
                   np.clip((xs - dx0) / dw * 0.5 + (ys - dy0) / dh * 0.5, 0, 0.99))
        c.rect(dx0 + dw // 2, dy0, 1, dh, OUTLINE)
        for py in range(dy0 + 22, dy0 + dh - 4, 8):
            for px_ in range(dx0 + 4, dx0 + dw - 2, 8):
                x = px_ + (4 if (py // 8) % 2 else 0)
                if dx0 + 2 < x < dx0 + dw - 2 and x != dx0 + dw // 2:
                    c.px(x, py, GILT[2]); c.px(x + 1, py + 1, DOOR[0])
        port = c.ellipse_mask(dx0 + dw / 2 + 0.5, dy0 + 10, 7, 7)
        c.shade(port, dx0 + dw / 2, dy0 + 10, 7, 7, GILT[1:])
        inner = c.ellipse_mask(dx0 + dw / 2 + 0.5, dy0 + 10, 5, 5)
        c.shade(inner, dx0 + dw / 2, dy0 + 10, 5, 5, [PURPLE[1], NEON[0], NEON[1]], cuts=(0.1, 0.6))
        c.rect(dx0 + dw // 2 - 4, dy0 + 34, 2, 6, GILT[3]); c.rect(dx0 + dw // 2 + 3, dy0 + 34, 2, 6, GILT[2])
    return c


# ---------- the buttons ----------

def note_icon(c, x, y, col):
    """A double eighth note, 10 x 11."""
    c.rect(x + 3, y, 7, 2, col)
    c.rect(x + 3, y, 2, 9, col); c.rect(x + 8, y, 2, 8, col)
    c.rect(x, y + 8, 4, 3, col); c.rect(x + 5, y + 7, 4, 3, col)


def clock_icon(c, x, y, ring, face, hand):
    """A stopwatch, 11 x 12."""
    c.rect(x + 4, y, 3, 2, ring)
    m = c.ellipse_mask(x + 5.5, y + 7, 5.5, 5)
    c.fill(m, ring)
    c.fill(c.ellipse_mask(x + 5.5, y + 7, 4, 3.6), face)
    c.rect(x + 5, y + 4, 1, 4, hand); c.rect(x + 5, y + 7, 3, 1, hand)


def button(kind, pressed):
    """A gold pedestal with a big dome button on top and an icon and label on its front plate."""
    w, h = 32, 48
    c = Canvas(w, h)
    ramp = TEAL if kind == 'music' else RED
    top = 14
    # Pedestal: a column with a wider foot and cap.
    box(c, 5, top + 4, 22, 3, GILT)
    box(c, 7, top + 8, 18, h - top - 14, PURPLE[1:])
    box(c, 4, h - 5, 24, 4, GILT)
    # Front plate with icon and label.
    c.rect(9, top + 10, 14, 14, UI_FILL); frame(c, 9, top + 10, 14, 14, GILT[1])
    if kind == 'music':
        note_icon(c, 11, top + 12, ramp[3] if pressed else ramp[2])
    else:
        clock_icon(c, 10, top + 11, ramp[2], WHITE if pressed else STEEL[3], OUTLINE)
    label = 'MUSIC' if kind == 'music' else 'TIMER'
    c.rect(6, top + 26, 20, 7, UI_FILL)
    text(c, label, 7, top + 27, GILT[3] if pressed else GILT[2])
    # Dome: up, or pushed down and lit.
    ys, xs = np.mgrid[0:h, 0:w]
    dy = 4 if pressed else 0
    dome = c.ellipse_mask(16, top + 4, 11, 12 - dy) & (ys < top + 4)
    c.shade(dome, 12, top - 4 + dy, 11, 10, ramp[1:] + [WHITE] if pressed else ramp, cuts=(-0.6, -0.1, 0.5))
    outline_of(c, dome)
    c.rect(5, top + 3, 22, 1, OUTLINE)
    if pressed:  # light rays round the lit dome
        for x, y in ((2, top - 2), (29, top - 2), (16, top - 11), (6, top - 8), (26, top - 8)):
            c.px(x, y, ramp[3])
    c.outline()
    return c


# ---------- the popup ----------

POPUP_TEXT_BOX = (44, 16, 176, 56)     # x, y, w, h on popup-timer.png where the game writes the question


def popup_timer():
    """The dialog panel that asks whether to start the timer: the dialog box look with a big stopwatch on the left."""
    w, h = 232, 88
    c = Canvas(w, h)
    c.rect(1, 1, w - 2, h - 2, UI_FILL)
    frame(c, 2, 2, w - 4, h - 4, GILT[2], t=2)
    c.rect(2, 2, w - 4, 1, GILT[3]); c.rect(2, 2, 1, h - 4, GILT[3])
    c.rect(2, h - 3, w - 4, 1, GILT[1]); c.rect(w - 3, 2, 1, h - 4, GILT[1])
    frame(c, 0, 0, w, h, OUTLINE)
    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        c.a[y, x, 3] = 0
    # A big stopwatch (the small icon drawn at 2x).
    icon = Canvas(12, 13)
    clock_icon(icon, 0, 0, RED[2], WHITE, OUTLINE)
    big = np.repeat(np.repeat(icon.a, 2, 0), 2, 1)
    m = big[..., 3] > 0
    c.a[24:24 + big.shape[0], 12:12 + big.shape[1]][m] = big[m]
    return c


# ---------- the lounge ----------

def lounge():
    """The bonus room wall: deep purple with gold art-deco fans, a velvet valance along the top. Tiles every 640 px."""
    w, h = 640, 360
    c = Canvas(w, h)
    ys, xs = np.mgrid[0:h, 0:w]
    put(c, np.ones((h, w), bool), PURPLE[1])
    put(c, (ys < 200) & ((xs + ys) % 2 == 0) & (ys < 120 + (xs % 7)), PURPLE[2])
    put(c, (ys < 120), PURPLE[2])
    # Pinstripes every 32 px, dim gold.
    put(c, (xs % 32 == 0) & (ys > 40), '#3a2a2e')
    # Art-deco fans every 160 px along a gold rail.
    rail = 120
    c.rect(0, rail, w, 2, GILT[1]); c.rect(0, rail + 2, w, 1, OUTLINE)
    for cx in range(80, w, 160):
        for r in (26, 20, 14):
            ring = (np.hypot(xs - cx, ys - rail) <= r) & (np.hypot(xs - cx, ys - rail) > r - 2) & (ys < rail)
            put(c, ring, GILT[1] if r != 20 else '#5a3a2a')
        for a in np.linspace(np.pi * 1.1, np.pi * 1.9, 5):
            for t in range(4, 26):
                c.px(int(cx + np.cos(a) * t), int(rail + np.sin(a) * t), '#5a3a2a')
    # Wainscot below a second rail, darker panels.
    low = 250
    c.rect(0, low, w, 3, GILT[1]); c.rect(0, low, w, 1, GILT[2]); c.rect(0, low + 3, w, 1, OUTLINE)
    put(c, ys > low + 3, PURPLE[1])
    for px_ in range(8, w, 64):
        frame(c, px_, low + 14, 48, 80, '#30233f')
    # Velvet valance with gold tassels.
    for x in range(w):
        sag = int(8 * np.sin((x % 80) / 80 * np.pi))
        for y in range(0, 24 + sag):
            t = y / (24 + sag)
            c.px(x, y, VELVET[2] if (x % 80) < 20 and t < 0.7 else VELVET[1] if t < 0.85 else VELVET[0])
        c.px(x, 24 + sag, OUTLINE)
        if x % 80 == 0:
            c.rect(x - 1, 22, 3, 8, GILT[2]); c.rect(x - 2, 30, 5, 3, GILT[1]); c.px(x, 33, OUTLINE)
    c.rect(0, 0, w, 4, GILT[1]); c.rect(0, 4, w, 1, OUTLINE)
    return c


# ---------- the trampoline floor ----------

def trampoline(squash):
    """One 32 x 32 floor tile: a padded red and white trampoline edge, a black mat, springs and a steel frame.
    Tiles left to right; the squashed frame is shown for a moment under the player when he bounces."""
    c = Canvas(32, 32)
    dip = 3 if squash else 0
    # Steel frame and dark base.
    c.rect(0, 22, 32, 10, PURPLE[1]); c.rect(0, 22, 32, 3, STEEL[2]); c.rect(0, 22, 32, 1, STEEL[3]); c.rect(0, 25, 32, 1, OUTLINE)
    for lx in (3, 19):                                   # legs
        c.rect(lx, 26, 3, 6, STEEL[1]); c.rect(lx, 26, 1, 6, STEEL[2])
    # Springs from the frame up to the mat: steel coils, two per tile.
    mat_y = 4 + dip
    for sx in (7, 23):
        for y in range(mat_y + 8, 22):
            k = (y - mat_y) % 3
            c.rect(sx - 2, y, 5, 1, [STEEL[3], STEEL[2], STEEL[0]][k])
        c.px(sx - 3, mat_y + 8, OUTLINE)
    # Pad: red and white padded segments over a black mat.
    for x in range(32):
        sag = int(round(dip * np.sin(x / 31 * np.pi))) if squash else 0
        y0 = 4 + sag
        col = RED if (x // 16) % 2 == 0 else ['#a396a6', '#cfcdcd', '#fdfefd', '#fdfefd']
        c.px(x, y0 - 1, OUTLINE)
        c.px(x, y0, col[3]); c.rect(x, y0 + 1, 1, 2, col[2]); c.px(x, y0 + 3, col[1]); c.px(x, y0 + 4, OUTLINE)
        c.rect(x, y0 + 5, 1, 3, '#221533'); c.px(x, y0 + 8, OUTLINE)
        if x % 16 == 15:
            c.rect(x, y0, 1, 4, OUTLINE)
    return c


# ---------- the portrait frame ----------

FRAME_BORDER = 10                          # px of gold around the picture on each side
FRAME_PICTURE = (288, 224)                 # picture size inside (the big boss portrait)


def portrait_frame():
    pw, ph = FRAME_PICTURE
    b = FRAME_BORDER
    w, h = pw + 2 * b, ph + 2 * b
    c = Canvas(w, h)
    ys, xs = np.mgrid[0:h, 0:w]
    ring = ~((xs >= b) & (xs < w - b) & (ys >= b) & (ys < h - b))
    d = np.minimum(np.minimum(xs, w - 1 - xs), np.minimum(ys, h - 1 - ys))
    lit = (xs < w - 1 - xs) & (ys < h - 1 - ys) | ((xs + ys) < (w + h) / 2) & (np.minimum(xs, ys) == d)
    col = np.where(d < 2, 1, np.where(d < 4, 3, np.where(d < 7, 2, 1)))
    for i, cc in enumerate(GILT):
        put(c, ring & (col == i), cc)
    put(c, ring & (d >= 2) & (d < 4) & ~lit, GILT[2])
    put(c, ring & (d == b - 1), GILT[0])
    # Corner ornaments: a little gold rosette.
    for x, y in ((b // 2, b // 2), (w - 1 - b // 2, b // 2), (b // 2, h - 1 - b // 2), (w - 1 - b // 2, h - 1 - b // 2)):
        m = c.ellipse_mask(x + 0.5, y + 0.5, 4, 4)
        c.shade(m, x, y, 4, 4, GILT[1:]); outline_of(c, m)
    put(c, (d == 0), OUTLINE)
    put(c, (xs == b - 1) & (ys >= b - 1) & (ys <= h - b) | (xs == w - b) & (ys >= b - 1) & (ys <= h - b)
        | (ys == b - 1) & (xs >= b - 1) & (xs <= w - b) | (ys == h - b) & (xs >= b - 1) & (xs <= w - b), OUTLINE)
    return c


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art/bonus'
    os.makedirs(out, exist_ok=True)
    vip_door(False).save(os.path.join(out, 'vip-door.png'))
    vip_door(True).save(os.path.join(out, 'vip-door-open.png'))
    for kind in ('music', 'timer'):
        button(kind, False).save(os.path.join(out, f'button-{kind}.png'))
        button(kind, True).save(os.path.join(out, f'button-{kind}-pressed.png'))
    popup_timer().save(os.path.join(out, 'popup-timer.png'))
    lounge().save(os.path.join(out, 'lounge.png'))
    trampoline(False).save(os.path.join(out, 'trampoline-0.png'))
    trampoline(True).save(os.path.join(out, 'trampoline-1.png'))
    portrait_frame().save(os.path.join(out, 'portrait-frame.png'))
    print('saved to', out)


if __name__ == '__main__':
    main()
