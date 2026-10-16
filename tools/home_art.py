"""Draws the home screen: Boris's music studio after Sandro's reference photos, with the 10 levels
hanging as instant photos on two strings across the acoustic panels.

Same rules as world_art.py: drawn at the hero's pixel size (twice the world resolution), #150b22
outline, ramps lit from the top left.

Outputs (default /mnt/project-files/art/home, or the folder given as the first argument):
  studio.png                  640 x 360 backdrop, one screen. Floor line at y=268.
  cards/card-NN-done.png      a finished level: white instant photo with its number, transparent window
                              where the game shows that level's winner photo (draw the photo under the card)
  cards/card-NN-open.png      the next level to play: dark window with a gold play arrow
  cards/card-NN-locked.png    a level not reached yet: dull card, padlock
  select-0.png, select-1.png  gold highlight around the chosen card (blink between them)
  preview.png                 the backdrop with 3 levels done, level 4 open and selected, at 2x

Card placement: every card sprite is CARD_SPRITE (40 x 46); its top-left goes at CARD_POS[level - 1].
The photo window on the sprite is CARD_WINDOW. The select frame goes at the card position + SELECT_OFFSET.

Run from the repo root:  python3 tools/home_art.py [out_dir]   (needs Pillow and numpy)
"""
import os
import sys
import random
import numpy as np
from PIL import Image
from pixelkit import Canvas, OUTLINE, rgb
from intro_art import put, box, frame, outline_of, GILT, CREAM, OAK, PLASTER, UI_FILL

W, H = 640, 360
FLOOR_Y = 268
CEIL_Y = 44

FELT = ['#0e0c12', '#17141c', '#211d28', '#2e2936']           # acoustic panels and bass traps
SEAM = '#8e6a3a'                                               # the thin light strips between panels
DESK = ['#0a090d', '#141218', '#221f28', '#34303c']
WOOD = ['#4a2814', '#6a3c20', '#84502c', '#9c6236', '#b47844']   # floor planks
LED = ['#e0731a', '#f6a64a', '#ffd27a']
SILVER = ['#4a4a52', '#7a7a84', '#b4b4bc', '#e4e4ea']
RED = ['#7a1020', '#c0203a', '#f04a5a']
CARD = ['#bdbaba', '#dcdada', '#f4f3f1', '#fdfefd']
DULL = ['#5a5560', '#77727c', '#8e8994', '#a29ea6']

MONITOR_SCREEN = (293, 224, 54, 26)        # x, y, w, h of the monitor's screen on the desk
HINT_AREA = (200, 312, 240, 36)            # free floor in front of Boris: room for the level hint
TITLE_PANEL = (268, 64, 103, 65)           # the top two panels in the middle: room for the game title
PLAY_POS = (303, 146)                      # top-left of play-button*.png (34 x 34) on the lower middle panels
PLAY_SELECT_OFFSET = (-5, -5)              # play-select-*.png (44 x 44) goes at PLAY_POS + this
FURNITURE_FOOT = 300                       # desk, speakers and chair stand on Boris's line (his feet at y=300)
DESK_HEIGHT = 38                           # desk top this far above the feet
DESK_X0, DESK_X1 = 250, 390
BORIS_SPOT = (300, 300)                    # feet x, y: standing at the desk

# ---------- the cards ----------

CARD_SPRITE = (40, 46)
CARD_WINDOW = (4, 10, 32, 22)              # x, y, w, h on the card sprite (10:7, like Felix's photo)
SELECT_OFFSET = (-3, 3)
STRINGS = [(40, 252), (388, 600)]          # left and right garland: x of the two nails
STRING_Y, SAG = 66, 10
PITCH = 42


def string_y(x, x0, x1):
    u = (x - (x0 + x1) / 2) / ((x1 - x0) / 2)
    return STRING_Y + SAG * (1 - u * u)


def card_positions():
    pos = []
    for x0, x1 in STRINGS:
        for i in range(5):
            cx = x0 + 21 + PITCH * i
            pos.append((cx - 20, int(round(string_y(cx, x0, x1))) - 3))
    return pos


CARD_POS = card_positions()

DIGITS = {
    '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'], '3': ['###', '..#', '.##', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'], '9': ['###', '#.#', '###', '..#', '###'],
}


def number(c, text, cx, y, col):
    """Digits in a 3x5 font, drawn at 2x (6 x 10 each, 2 px apart), centred on cx."""
    w = len(text) * 8 - 2
    x = cx - w // 2
    for ch in text:
        for gy, row in enumerate(DIGITS[ch]):
            for gx, v in enumerate(row):
                if v == '#':
                    c.rect(x + gx * 2, y + gy * 2, 2, 2, col)
        x += 8


def padlock(c, cx, cy, ramp):
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    shackle = (((xs + .5 - cx) / 5) ** 2 + ((ys + .5 - (cy - 2)) / 5) ** 2 <= 1) & (((xs + .5 - cx) / 3) ** 2 + ((ys + .5 - (cy - 2)) / 3) ** 2 > 1) & (ys < cy)
    put(c, shackle, ramp[2])
    body = (xs >= cx - 6) & (xs < cx + 6) & (ys >= cy) & (ys < cy + 8)
    put(c, body, ramp[2]); put(c, body & (ys == cy), ramp[3]); put(c, body & (ys >= cy + 6), ramp[1])
    c.rect(cx - 1, cy + 2, 2, 3, ramp[0])
    outline_of(c, shackle | body)


def card(level, state):
    cw, chh = CARD_SPRITE
    c = Canvas(cw, chh)
    ramp = DULL if state == 'locked' else CARD
    x0, y0 = 1, 7                                   # the card itself, under the clip
    w, h = cw - 2, chh - 8
    c.rect(x0, y0, w, h, ramp[2])
    c.rect(x0, y0, w, 1, ramp[3]); c.rect(x0, y0, 1, h, ramp[3])
    c.rect(x0, y0 + h - 1, w, 1, ramp[0]); c.rect(x0 + w - 1, y0, 1, h, ramp[0])
    wx, wy, ww, wh = CARD_WINDOW
    frame(c, wx - 1, wy - 1, ww + 2, wh + 2, ramp[0])
    if state == 'done':
        c.a[wy:wy + wh, wx:wx + ww] = 0
    else:
        c.rect(wx, wy, ww, wh, UI_FILL)
        cx, cy = wx + ww // 2, wy + wh // 2
        if state == 'open':
            for i in range(11):                    # play arrow
                c.rect(cx - 3, cy - 5 + i, 6 - abs(i - 5), 1, GILT[3] if i < 3 else GILT[2] if i < 7 else GILT[1])
        else:
            padlock(c, cx, cy - 2, DULL)
    number(c, str(level), cw // 2, wy + wh + 2, '#221533' if state != 'locked' else DULL[0])
    # Wooden clothes-peg on top, gripping the string.
    c.rect(cw // 2 - 3, 0, 6, 11, OAK[2]); c.rect(cw // 2 - 3, 0, 2, 11, OAK[3]); c.rect(cw // 2 + 2, 0, 1, 11, OAK[1])
    c.rect(cw // 2 - 3, 4, 6, 1, OAK[0])
    m = c.a[..., 3] > 0
    if state == 'done':
        m[wy:wy + wh, wx:wx + ww] = True           # no outline inside the empty window
    outline_of(c, m)
    return c


def select_frame(f):
    """A blinking gold frame around the card body (40 x 38 card, 46 x 46 frame)."""
    c = Canvas(46, 46)
    col, inner = (GILT[3], GILT[1]) if f == 0 else (LED[2], LED[1])
    frame(c, 1, 1, 44, 44, col, t=2)
    frame(c, 3, 3, 40, 40, inner)
    for x, y in ((1, 1), (43, 1), (1, 43), (43, 43)):
        c.rect(x, y, 2, 2, '#fdfefd')
    frame(c, 0, 0, 46, 46, OUTLINE)
    return c


# ---------- the studio ----------

def egg_crate(c, x0, y0, x1, y1):
    """A ceiling cloud: black frame round an egg-crate diffuser lit warm from inside, orange LED strip under it."""
    c.rect(x0, y0, x1 - x0, y1 - y0, DESK[1])
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    inner = (xs >= x0 + 3) & (xs < x1 - 3) & (ys >= y0 + 3) & (ys < y1 - 3)
    gx, gy = (xs - x0 - 3) % 8, (ys - y0 - 3) % 6
    put(c, inner, CREAM[3])
    put(c, inner & ((gx == 0) | (gy == 0)), CREAM[4])
    put(c, inner & ((gx == 7) | (gy == 5)), CREAM[1])
    put(c, inner & (gx >= 3) & (gx <= 4) & (gy >= 2) & (gy <= 3), CREAM[2])
    c.rect(x0, y1 - 1, x1 - x0, 1, DESK[3])
    c.rect(x0 + 2, y1, x1 - x0 - 4, 2, LED[2]); c.rect(x0 + 2, y1 + 2, x1 - x0 - 4, 1, LED[1])
    frame(c, x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2, OUTLINE)


def panel_grid(c, x0, y0, cols, rows, cw, ch):
    """Black felt panels in a dark frame, thin warm seams between them (like the photos)."""
    ws, hs = cols * cw, rows * ch
    c.rect(x0 - 3, y0 - 3, ws + 6, hs + 6, FELT[0])
    for i in range(cols):
        for j in range(rows):
            x, y = x0 + i * cw, y0 + j * ch
            c.rect(x, y, cw - 1, ch - 1, FELT[2])
            ys, xs = np.mgrid[0:c.h, 0:c.w]
            cell = (xs >= x) & (xs < x + cw - 1) & (ys >= y) & (ys < y + ch - 1)
            put(c, cell & ((xs + ys) % 4 == 0), FELT[1])             # felt texture
            c.rect(x, y, cw - 1, 1, FELT[3]); c.rect(x, y, 1, ch - 1, FELT[3])
            frame(c, x - 1, y - 1, cw + 1, ch + 1, SEAM)
    c.rect(x0 - 3, y0 + hs + 2, ws + 6, 1, FELT[0])
    frame(c, x0 - 4, y0 - 4, ws + 8, hs + 8, OUTLINE)
    # The wall below the panel group catches a soft shadow.
    c.rect(x0 - 2, y0 + hs + 4, ws + 4, 2, PLASTER[0])


def bass_trap(c, x0, x1, light_from_right):
    """A tall felt column in the corner, shaded round."""
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    m = (xs >= x0) & (xs < x1) & (ys >= CEIL_Y) & (ys < FLOOR_Y + 22)
    u = (xs - x0) / (x1 - x0)
    t = u if not light_from_right else 1 - u
    for lo, hi, col in ((0, .25, FELT[1]), (.25, .55, FELT[2]), (.55, .75, FELT[3]), (.75, 1.01, FELT[1])):
        put(c, m & (t >= lo) & (t < hi), col)
    for y in range(CEIL_Y + 60, FLOOR_Y, 64):
        put(c, m & (ys == y), SEAM)
    outline_of(c, m)


def speaker(c, x0, y0, foot_y):
    """A studio monitor on a light wooden stand: woofer below, ribbon tweeter on top."""
    cw, ch = 31, 39
    cx = x0 + cw // 2
    # Stand: two light wooden posts with cross bars, a foot plate on the floor.
    for x in (cx - 8, cx + 4):
        box(c, x, y0 + ch, 4, foot_y - 3 - (y0 + ch), OAK[1:])
    box(c, cx - 8, y0 + ch, 16, 3, OAK[1:])
    box(c, cx - 8, y0 + ch + 16, 16, 2, OAK[1:])
    box(c, cx - 11, foot_y - 3, 22, 3, OAK[1:])
    # Cabinet.
    box(c, x0, y0, cw, ch, DESK[1:])
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    wx, wy = cx + .5, y0 + 26.5
    r = ((xs + .5 - wx) ** 2 + (ys + .5 - wy) ** 2) ** .5
    put(c, r < 8.5, SILVER[1]); put(c, (r < 8.5) & (xs + ys < wx + wy - 4), SILVER[2])
    put(c, r < 6.5, DESK[0]); put(c, (r < 6.5) & (r >= 5) & (xs + ys < wx + wy), DESK[2])
    put(c, r < 2, SILVER[1]); put(c, (r < 1.2), SILVER[3])
    outline_of(c, r < 8.5)
    # Ribbon tweeter.
    c.rect(cx - 5, y0 + 5, 11, 10, SILVER[1]); c.rect(cx - 5, y0 + 5, 11, 1, SILVER[3])
    c.rect(cx - 3, y0 + 7, 7, 6, DESK[0])
    for y in (y0 + 8, y0 + 10):
        c.rect(cx - 2, y, 5, 1, GILT[2])
    frame(c, cx - 6, y0 + 4, 13, 12, OUTLINE)
    c.rect(x0 + 3, y0 + ch - 5, 2, 1, LED[2])           # power light


def daw_screen(c, x, y, w, h):
    """A dark DAW arrangement: track rows with colourful clips, a white playhead."""
    rnd = random.Random(7)
    c.rect(x, y, w, h, '#121624')
    c.rect(x, y, w, 5, '#2a3450'); c.rect(x + 2, y + 1, 10 if w > 60 else 5, 3, '#4a5880')
    for i in range(4 if w > 60 else 0):
        c.rect(x + w - 8 - i * 6, y + 1, 4, 3, ['#3cae4a', '#f6a64a', '#f04a5a', '#688ab0'][i])
    side = 14 if w > 60 else 6
    clip_cols = [('#2aa8a0', '#1a6a66'), ('#9a5ad0', '#5a2a8a'), ('#f2852a', '#9a4a10'), ('#e05a9a', '#8a2a5a'), ('#5aa0f0', '#2a5a9a')]
    c.rect(x, y + 5, side, h - 5, '#1c2236')
    row_h = 6 if h > 30 else 4
    for r in range((h - 6) // row_h):
        ry = y + 6 + r * row_h
        c.rect(x + 1, ry + 1, side - 2, row_h - 3, clip_cols[r % 5][1])
        cx = x + side + 2 + rnd.randint(0, 10)
        while cx < x + w - 6:
            cw = rnd.randint(10, 28) if w > 60 else rnd.randint(5, 12)
            cw = min(cw, x + w - 2 - cx)
            hi, lo = clip_cols[r % 5]
            c.rect(cx, ry, cw, row_h - 1, lo); c.rect(cx, ry, cw, 1, hi)
            for k in range(cx + 1, cx + cw - 1, 2):
                amp = rnd.randint(0, 1)
                c.rect(k, ry + (row_h - 1) // 2 - amp, 1, 1 + amp * 2, hi)
            cx += cw + rnd.randint(2, 12)
        c.rect(x + side, ry + row_h - 1, w - side, 1, '#1c2236')
    ph = x + int(w * 0.6)
    c.rect(ph, y + 5, 1, h - 5, '#fdfefd')
    c.rect(ph - 1, y + 5, 3, 1, '#fdfefd')


def headphones(c, cx, by):
    """Over-ear headphones lying on the desk, band up."""
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    r = (((xs + .5 - cx) / 6) ** 2 + ((ys + .5 - by) / 6) ** 2)
    band = (r <= 1) & (r > 0.55) & (ys < by - 1)
    put(c, band, SILVER[1]); put(c, band & (ys < by - 4), SILVER[2])
    cups = np.zeros_like(band)
    for ex in (cx - 5, cx + 5):
        cups |= ((xs + .5 - ex) / 2.5) ** 2 + ((ys + .5 - by) / 3) ** 2 <= 1
    put(c, cups, DESK[3])
    for ex in (cx - 5, cx + 5):
        c.px(ex, by - 1, GILT[2])
    outline_of(c, band | cups)


def chair(c, cx, foot_y):
    """A black office chair, like the photos: back rest, seat about 16 px up, gas lift, five-star base."""
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    parts = np.zeros((c.h, c.w), bool)
    seat_y = foot_y - 16
    by = foot_y - 4
    for dx, dy in ((-10, 1), (10, 1), (-5, 3), (6, 3), (0, 0)):
        for k in range(0, 21):
            x = int(round(cx + dx * k / 20)); y = int(round(by + dy * k / 20))
            c.rect(x, y, 2, 2, DESK[2]); parts[y:y + 2, x:x + 2] = True
        wheel = ((xs + .5 - (cx + dx + 1)) / 1.6) ** 2 + ((ys + .5 - (by + dy + 3)) / 1.6) ** 2 <= 1
        put(c, wheel, DESK[1]); parts |= wheel
    lift = (xs >= cx - 1) & (xs < cx + 2) & (ys >= seat_y + 2) & (ys < by)
    put(c, lift, SILVER[1]); put(c, lift & (xs == cx - 1), SILVER[2]); parts |= lift
    back = ((xs + .5 - (cx + 5)) / 6) ** 2 + ((ys + .5 - (seat_y - 11)) / 8) ** 2 <= 1
    spine = (xs >= cx + 3) & (xs < cx + 5) & (ys >= seat_y - 4) & (ys < seat_y + 1)
    put(c, spine, DESK[2]); put(c, back, DESK[2]); put(c, back & ((xs - cx) + (ys - seat_y) < -14), DESK[3])
    put(c, back & (xs >= cx + 9), DESK[1])
    parts |= back | spine
    seat = ((xs + .5 - cx) / 10) ** 2 + ((ys + .5 - seat_y) / 3) ** 2 <= 1
    put(c, seat, DESK[2]); put(c, seat & (ys < seat_y - 1), DESK[3]); put(c, seat & (ys > seat_y + 1), DESK[1])
    parts |= seat
    outline_of(c, parts)


def studio():
    c = Canvas(W, H)
    ys, xs = np.mgrid[0:H, 0:W]
    # Ceiling: dark, three glowing egg-crate clouds.
    put(c, ys < CEIL_Y, '#1a1424')
    put(c, (ys < CEIL_Y) & ((xs + ys) % 3 == 0), '#221a2e')
    # Back wall: white, warm under the ceiling lights, a little greyer towards the floor.
    wall = (ys >= CEIL_Y) & (ys < FLOOR_Y)
    put(c, wall, PLASTER[2])
    put(c, wall & (ys < CEIL_Y + 8), '#fbf0dc'); put(c, wall & (ys >= CEIL_Y + 8) & (ys < CEIL_Y + 16) & ((xs + ys) % 2 == 0), '#fbf0dc')
    put(c, wall & (ys >= FLOOR_Y - 40) & ((xs + ys) % 2 == 0), PLASTER[1])
    put(c, wall & (ys >= FLOOR_Y - 14), PLASTER[1]); put(c, wall & (ys >= FLOOR_Y - 14) & ((xs + ys) % 2 == 0), PLASTER[0])
    c.rect(0, CEIL_Y, W, 1, PLASTER[0])
    egg_crate(c, 96, 4, 544, 30)
    egg_crate(c, -4, 6, 76, 26)
    egg_crate(c, 564, 6, 644, 26)
    # Acoustic panels: two big groups and a smaller pair behind the monitor.
    panel_grid(c, 48, 60, 2, 2, 100, 74)
    panel_grid(c, 392, 60, 2, 2, 100, 74)
    panel_grid(c, 268, 64, 2, 2, 52, 66)
    # Bass traps in the corners.
    bass_trap(c, 0, 34, False)
    bass_trap(c, 606, 640, True)
    # The two strings the level photos hang on, with a brass nail at each end.
    for x0, x1 in STRINGS:
        for x in range(x0, x1 + 1):
            y = int(round(string_y(x, x0, x1)))
            c.px(x, y, '#d8c8a8'); c.px(x, y + 1, '#7a6450')
        for x in (x0, x1):
            c.rect(x - 2, STRING_Y - 2, 4, 4, GILT[2]); c.px(x - 2, STRING_Y - 2, GILT[3]); frame(c, x - 3, STRING_Y - 3, 6, 6, OUTLINE)
    # Wooden floor: planks running towards the back, staggered joints.
    vpx, vpy = 320, 150
    floor = ys >= FLOOR_Y
    dy = np.maximum(ys - vpy, 1)
    t = (xs - vpx) / dy * 9
    plank = np.floor(t).astype(int)
    seam = (t - plank) * (dy / 9) < 1
    z = 900 / dy
    row = np.floor(z * 0.7 + ((plank * 37) % 10) / 10).astype(int)
    tone = (plank * 5 + row * 3) % 4
    for k, col in enumerate((WOOD[2], WOOD[3], WOOD[3], WOOD[2])):
        put(c, floor & (tone == k), col)
    grain = (((xs - vpx) / dy * 9 * 5).astype(int) % 5 == 2) & ((ys + plank) % 3 == 0)
    put(c, floor & grain & (tone == 1), WOOD[4]); put(c, floor & grain & (tone == 0), WOOD[1])
    joint = floor & (row != np.roll(row, 1, 0))
    put(c, floor & seam, WOOD[1]); put(c, joint, WOOD[1])
    c.rect(0, FLOOR_Y - 3, W, 3, DESK[2]); c.rect(0, FLOOR_Y - 3, W, 1, DESK[3]); c.rect(0, FLOOR_Y, W, 1, OUTLINE)   # skirting
    # Everything on the floor stands on Boris's line: feet at FURNITURE_FOOT.
    fy = FURNITURE_FOOT
    pool = floor & ((((xs - 320) / 84) ** 2 + ((ys - (fy - 6)) / 9) ** 2) < 1)
    core = floor & ((((xs - 320) / 64) ** 2 + ((ys - (fy - 7)) / 6) ** 2) < 1)
    put(c, pool & ~core & ((xs + ys) % 2 == 0) & ~seam, WOOD[4]); put(c, core & ~seam, WOOD[4])
    speaker(c, 211, fy - 73, fy)
    speaker(c, 398, fy - 73, fy)
    # The desk: black top, thin front edge, warm LED strip under it, slim legs.
    dx0, dx1, top = DESK_X0, DESK_X1, fy - DESK_HEIGHT
    for lx in (dx0 + 7, dx1 - 12):
        box(c, lx, top + 9, 5, fy - (top + 9), DESK[1:])
    box(c, dx0, top, dx1 - dx0, 5, [DESK[1], DESK[2], DESK[3]])
    c.rect(dx0, top + 5, dx1 - dx0, 4, DESK[1]); c.rect(dx0, top + 8, dx1 - dx0, 1, DESK[0])
    c.rect(dx0 + 2, top + 9, dx1 - dx0 - 4, 1, LED[2])
    frame(c, dx0 - 1, top - 1, dx1 - dx0 + 2, 11, OUTLINE)
    # Monitor on the desk, with the DAW (MONITOR_SCREEN).
    sx, sy, sw, sh = MONITOR_SCREEN
    box(c, 316, top - 9, 8, 9, DESK[1:]); box(c, 307, top - 2, 26, 2, DESK[1:])
    box(c, sx - 3, sy - 3, sw + 6, sh + 6, DESK[1:])
    daw_screen(c, sx, sy, sw, sh)
    c.rect(sx, sy, 8, 1, '#5a6890')
    # Keyboard (red, like the photo), controller, mouse, headphones.
    box(c, 266, top + 1, 40, 3, RED, outline=False)
    c.rect(267, top + 2, 38, 1, '#fdfefd')
    for k in range(268, 305, 3):
        c.px(k, top + 2, DESK[0])
    frame(c, 265, top, 42, 5, OUTLINE)
    box(c, 334, top + 1, 18, 3, SILVER[:3])
    c.px(337, top + 2, '#3cae4a'); c.px(341, top + 2, '#f6a64a'); c.px(345, top + 2, '#e05a9a')
    box(c, 360, top + 1, 5, 2, DESK[1:])
    headphones(c, 256, top)
    chair(c, 374, fy + 4)
    return c


# ---------- the music: play button and song menu ----------

def play_button(on):
    """A round button like a record: gold rim, dark grooves, white play arrow (or gold pause bars while music plays)."""
    c = Canvas(34, 34)
    ys, xs = np.mgrid[0:34, 0:34]
    r = np.hypot(xs + .5 - 17, ys + .5 - 17)
    disc = r < 16
    put(c, disc, GILT[1]); put(c, disc & (xs + ys < 28), GILT[2]); put(c, disc & (xs + ys < 16), GILT[3])
    inner = r < 13
    put(c, inner, UI_FILL)
    put(c, inner & (r > 6) & (np.round(r) % 2 == 0), '#2e2244')                  # grooves
    put(c, inner & (r > 6) & (r < 12) & (abs(xs - ys) < 2) & (xs < 17), '#4a3a66')   # a shine on the grooves
    outline_of(c, disc)
    if on:
        for x in (12, 19):
            c.rect(x, 10, 4, 14, GILT[2]); c.rect(x, 10, 4, 1, GILT[3]); c.rect(x, 10, 1, 14, GILT[3])
            frame(c, x - 1, 9, 6, 16, OUTLINE)
    else:
        tri = np.zeros((34, 34), bool)
        for i in range(15):
            tri[10 + i, 13:13 + 1 + (7 - abs(i - 7))] = True
        put(c, tri, '#fdfefd'); put(c, tri & (ys > 19), CARD[1])
        outline_of(c, tri)
    return c


def play_select(f):
    """The blinking gold ring around the play button when it is chosen."""
    c = Canvas(44, 44)
    ys, xs = np.mgrid[0:44, 0:44]
    r = np.hypot(xs + .5 - 22, ys + .5 - 22)
    col, inner = (GILT[3], GILT[1]) if f == 0 else (LED[2], LED[1])
    put(c, (r < 21) & (r >= 19), col); put(c, (r < 19) & (r >= 18), inner)
    put(c, (r < 22) & (r >= 21), OUTLINE); put(c, (r < 18) & (r >= 17), OUTLINE)
    return c


SONG_MENU = (304, 168)
SONG_TITLE_BOX = (52, 10, 240, 20)         # where the game writes "PICK A SONG"
SONG_ROWS = [(24, 36 + 25 * i, 266, 22) for i in range(5)]   # x, y, w, h of each song row; write the name from x+28
SONG_ROW_SELECT_OFFSET = (-10, -2)         # song-row-select-*.png goes at the row's x, y + this (its arrow sits left of the row)


def song_menu():
    """The song picker: the dialog look with a small record in the corner, five rows with a note at the left."""
    w, h = SONG_MENU
    c = Canvas(w, h)
    c.rect(1, 1, w - 2, h - 2, UI_FILL)
    frame(c, 2, 2, w - 4, h - 4, GILT[2], t=2)
    c.rect(2, 2, w - 4, 1, GILT[3]); c.rect(2, 2, 1, h - 4, GILT[3])
    c.rect(2, h - 3, w - 4, 1, GILT[1]); c.rect(w - 3, 2, 1, h - 4, GILT[1])
    frame(c, 0, 0, w, h, OUTLINE)
    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        c.a[y, x, 3] = 0
    # Small record in the top-left corner of the header.
    ys, xs = np.mgrid[0:h, 0:w]
    r = np.hypot(xs + .5 - 28, ys + .5 - 20)
    put(c, r < 11, '#0e0c12'); put(c, (r < 11) & (r > 5) & (np.round(r) % 2 == 0), '#2a2532')
    put(c, r < 4, RED[1]); put(c, r < 1.2, '#0e0c12'); put(c, (r < 11) & (r > 7) & (abs(xs - ys - 8) < 2) & (xs < 28), '#5a5466')
    outline_of(c, r < 11)
    c.rect(10, 32, w - 20, 1, GILT[1])
    for i, (x, y, rw, rh) in enumerate(SONG_ROWS):
        c.rect(x, y, rw, rh, '#2a1d3e' if i % 2 == 0 else '#251a37')
        note(c, x + 8, y + 4)
    return c


def note(c, x, y):
    """A small eighth note in gold, 10 x 14."""
    c.rect(x + 6, y, 2, 11, GILT[2]); c.rect(x + 6, y, 4, 2, GILT[2]); c.rect(x + 8, y + 2, 2, 2, GILT[2])
    c.rect(x + 1, y + 9, 6, 4, GILT[2]); c.rect(x + 2, y + 9, 3, 1, GILT[3])


def song_row_select(f):
    """Gold bar around the chosen song row, with a little arrow on the left."""
    rw, rh = SONG_ROWS[0][2] + 4, SONG_ROWS[0][3] + 4
    c = Canvas(rw + 8, rh)
    col = GILT[3] if f == 0 else LED[2]
    frame(c, 8, 0, rw, rh, OUTLINE); frame(c, 9, 1, rw - 2, rh - 2, col, t=2)
    for i in range(7):
        c.rect(0, rh // 2 - 3 + i, 4 - abs(i - 3), 1, col)
    return c


def eq(f):
    """Three dancing bars that mark the song that is playing (and sit next to the play button). 12 x 12, 3 frames."""
    c = Canvas(12, 12)
    heights = [(6, 10, 4), (10, 4, 8), (4, 8, 10)][f]
    for i, hh in enumerate(heights):
        x = 1 + i * 4
        c.rect(x, 11 - hh, 2, hh, LED[1]); c.rect(x, 11 - hh, 2, 1, LED[2])
    c.outline()
    return c


def preview(studio_img, cards_dir, sample_photo, select=True):
    """The backdrop with levels 1-3 done (Felix's sample photo in the windows), level 4 open and selected."""
    base = Image.fromarray(studio_img.a, 'RGBA')
    ph = Image.open(sample_photo).convert('RGBA') if os.path.exists(sample_photo) else None
    wx, wy, ww, wh = CARD_WINDOW
    for lv in range(1, 11):
        state = 'done' if lv <= 3 else 'open' if lv == 4 else 'locked'
        x, y = CARD_POS[lv - 1]
        if state == 'done' and ph:
            base.alpha_composite(ph.resize((ww, wh), Image.LANCZOS), (x + wx, y + wy))
        im = Image.open(os.path.join(cards_dir, f'card-{lv:02d}-{state}.png'))
        base.alpha_composite(im, (x, y))
    base.alpha_composite(Image.fromarray(play_button(False).a, 'RGBA'), PLAY_POS)
    sel = Image.open(os.path.join(os.path.dirname(cards_dir), 'select-0.png'))
    x, y = CARD_POS[3]
    if select:
        base.alpha_composite(sel, (x + SELECT_OFFSET[0], y + SELECT_OFFSET[1]))
    return base.resize((W * 2, H * 2), Image.NEAREST)



def preview_music(studio_img, out):
    """The play button chosen and the song menu open over the darkened studio, song 2 playing."""
    base = preview(studio_img, os.path.join(out, 'cards'), os.path.join(out, 'sample-photo.png'), select=False).resize((W, H), Image.NEAREST)
    base.alpha_composite(Image.fromarray(play_button(True).a, 'RGBA'), PLAY_POS)
    base.alpha_composite(Image.fromarray(play_select(0).a, 'RGBA'), (PLAY_POS[0] + PLAY_SELECT_OFFSET[0], PLAY_POS[1] + PLAY_SELECT_OFFSET[1]))
    dim = Image.new('RGBA', base.size, (14, 10, 22, 150))
    base.alpha_composite(dim)
    mw, mh = SONG_MENU
    mx, my = (W - mw) // 2, (H - mh) // 2
    base.alpha_composite(Image.fromarray(song_menu().a, 'RGBA'), (mx, my))
    x, y, _, _ = SONG_ROWS[1]
    base.alpha_composite(Image.fromarray(song_row_select(0).a, 'RGBA'), (mx + x + SONG_ROW_SELECT_OFFSET[0], my + y + SONG_ROW_SELECT_OFFSET[1]))
    base.alpha_composite(Image.fromarray(eq(0).a, 'RGBA'), (mx + x + SONG_ROWS[1][2] - 18, my + y + 5))
    return base.resize((W * 2, H * 2), Image.NEAREST)


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art/home'
    cards = os.path.join(out, 'cards')
    os.makedirs(cards, exist_ok=True)
    s = studio()
    s.save(os.path.join(out, 'studio.png'))
    for lv in range(1, 11):
        for state in ('done', 'open', 'locked'):
            card(lv, state).save(os.path.join(cards, f'card-{lv:02d}-{state}.png'))
    for f in (0, 1):
        select_frame(f).save(os.path.join(out, f'select-{f}.png'))
    for on in (False, True):
        play_button(on).save(os.path.join(out, 'play-button-on.png' if on else 'play-button.png'))
    for f in (0, 1):
        play_select(f).save(os.path.join(out, f'play-select-{f}.png'))
        song_row_select(f).save(os.path.join(out, f'song-row-select-{f}.png'))
    for f in range(3):
        eq(f).save(os.path.join(out, f'eq-{f}.png'))
    song_menu().save(os.path.join(out, 'song-menu.png'))
    preview(s, cards, os.path.join(out, 'sample-photo.png')).save(os.path.join(out, 'preview.png'))
    preview_music(s, out).save(os.path.join(out, 'preview-music.png'))
    print('saved to', out, 'card positions:', CARD_POS)


if __name__ == '__main__':
    main()
