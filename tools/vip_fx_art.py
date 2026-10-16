"""Party effects for the VIP room: moving-head lights with their beams, and two CO2 cannons with the blast.

Same rules as bonus_art.py: drawn at the hero's pixel size (twice the world resolution), #150b22
outline, ramps lit from the top left. Beams and the CO2 cloud have no outline and use a few flat
alpha steps, so the game can draw them with additive blending (beams) or normal blending (CO2).

Outputs (default /mnt/project-files/art/vip-fx, or the folder given as the first argument):
  light-yoke.png              24 x 14  the clamp and U-bracket, hangs from the valance (origin top centre)
  light-head.png              18 x 18  the head that swings, lens pointing down (pivot = HEAD_PIVOT)
  light-head-on.png           18 x 18  same with the lens lit
  beam-pink/teal/gold.png     72 x 300 light cone, narrow end at the top centre (origin 0.5, 0)
  co2-cannon-left.png         32 x 56  floor cannon, nozzle straight up (origin bottom centre)
  co2-cannon-right.png        32 x 56  mirrored (the panel faces the other way)
  co2-blast-0..4.png          96 x 240 the white jet and its cloud, nozzle at the bottom centre
  preview-0/1.png, preview.gif, preview-blast.png   composites on the lounge wall (not used by the game)

Run from the repo root:  python3 tools/vip_fx_art.py [out_dir]   (needs Pillow and numpy)
"""
import os
import sys
import numpy as np
from PIL import Image
from pixelkit import Canvas, OUTLINE, rgb
from intro_art import put, box, frame, outline_of
from bonus_art import NEON, TEAL, STEEL, WHITE, lounge

HEAD_PIVOT = (9, 6)            # inside light-head.png: where the yoke arms hold it
YOKE_PIVOT = (12, 10)          # inside light-yoke.png: where the head's pivot goes
BEAM_W, BEAM_H = 72, 300
FLOOR_Y = 328                  # the VIP room floor (world 164) in picture pixels
LIGHT_X = (64, 192, 320, 448, 576)                  # where the fixtures hang along one 640 px wall tile
LIGHT_COLOURS = ('pink', 'teal', 'gold', 'teal', 'pink')
SWEEP, SWEEP_PERIOD = 32, 3.0  # beams swing +-32 degrees, one full swing every 3 seconds
CANNON_X = (150, 490)          # in the preview only; the game picks the spots
BEAMS = {'pink': NEON[1:], 'teal': TEAL[2:] + ['#e8ffff'], 'gold': ['#f0a830', '#ffd860', '#fff4c0']}
BLACK = ['#0e0413', '#221533', '#30233f', '#452c3b']
FOG = ['#b8c4d8', '#dce4f0', '#fdfefd']
CANNON_W, CANNON_H = 32, 56
NOZZLE_Y = 3                   # top of the cannon's mouth inside co2-cannon-*.png; the blast's bottom sits here
BLAST_W, BLAST_H = 96, 240


# ---------- moving-head light ----------

def light_yoke():
    c = Canvas(24, 14)
    c.rect(9, 0, 6, 3, STEEL[1]); c.rect(9, 0, 6, 1, STEEL[2])          # clamp on the truss
    c.rect(4, 3, 16, 3, BLACK[2]); c.rect(4, 3, 16, 1, BLACK[3])         # bracket bar
    c.rect(4, 3, 3, 9, BLACK[2]); c.rect(17, 3, 3, 9, BLACK[1])          # arms down to the pivot
    c.rect(4, 3, 1, 9, BLACK[3])
    c.rect(5, 9, 2, 2, STEEL[2]); c.rect(17, 9, 2, 2, STEEL[1])          # pivot bolts
    c.outline()
    return c


def light_head(on):
    c = Canvas(18, 18)
    body = c.ellipse_mask(9, 7, 7, 7)
    c.shade(body, 9, 7, 7, 7, BLACK[1:])
    # The lens points down: a ring at the bottom of the head.
    c.rect(4, 12, 10, 3, BLACK[2]); c.rect(4, 12, 10, 1, BLACK[3])
    lens = c.ellipse_mask(9, 14.5, 4, 1.6)
    put(c, lens, '#fff4c0' if on else STEEL[0])
    if on:
        put(c, c.ellipse_mask(9, 14.5, 2, 1), WHITE)
    c.px(5, 3, STEEL[2]); c.px(6, 2, STEEL[2])                           # shine
    c.outline()
    return c


def beam(ramp):
    """A cone of light, narrow at the top, a hot core along the middle, fading towards the floor."""
    c = Canvas(BEAM_W, BEAM_H)
    ys, xs = np.mgrid[0:BEAM_H, 0:BEAM_W]
    t = ys / BEAM_H
    half = 3 + t * (BEAM_W / 2 - 3)
    d = np.abs(xs + .5 - BEAM_W / 2) / half                              # 0 centre .. 1 edge
    inside = d <= 1
    fade = 1 - t * 0.75
    a = np.where(d < 0.25, 200, np.where(d < 0.6, 130, 70)) * fade
    a = (np.round(a / 30) * 30).clip(0, 255)                             # a few flat steps
    col = np.where(d[..., None] < 0.25, rgb(ramp[2]), np.where(d[..., None] < 0.6, rgb(ramp[1]), rgb(ramp[0])))
    c.a[..., :3] = np.where(inside[..., None], col, 0)
    c.a[..., 3] = np.where(inside, a, 0)
    # Every other row of the outer band dithered off, so the cone reads as pixel art.
    c.a[(d >= 0.6) & inside & ((xs + ys) % 2 == 0), 3] //= 2
    return c


# ---------- CO2 cannon ----------

def co2_cannon():
    """Left cannon: a black flight case with a tall steel jet nozzle pointing straight up."""
    c = Canvas(CANNON_W, CANNON_H)
    # Flight case with aluminium corners and a little status panel.
    box(c, 2, 34, 28, 21, BLACK[1:])
    c.rect(2, 34, 28, 2, STEEL[2]); c.rect(2, 53, 28, 2, STEEL[0])
    c.rect(2, 34, 2, 21, STEEL[1]); c.rect(28, 34, 2, 21, STEEL[1])
    c.rect(7, 40, 18, 7, BLACK[0])
    c.rect(9, 42, 3, 3, '#3cdc5a'); c.px(9, 42, '#b8ffc0')                # green ready LED
    c.rect(14, 42, 9, 1, STEEL[1]); c.rect(14, 44, 6, 1, STEEL[0])
    # Mount and the tube.
    c.rect(11, 29, 10, 5, BLACK[2]); c.rect(11, 29, 10, 1, BLACK[3])
    c.rect(13, 8, 6, 21, STEEL[2]); c.rect(13, 8, 2, 21, STEEL[3]); c.rect(18, 8, 1, 21, STEEL[0])
    c.rect(12, 18, 8, 2, STEEL[1])                                        # a collar
    c.rect(11, 3, 10, 5, STEEL[1]); c.rect(11, 3, 10, 1, STEEL[3]); c.rect(11, 3, 2, 5, STEEL[2])
    c.rect(13, 3, 6, 1, BLACK[0])                                         # the dark mouth
    c.outline()
    return c


def co2_blast(frame_):
    """The jet: 0 just fired, 1 full force, 2 billowing, 3 drifting cloud, 4 last wisps."""
    w, h = BLAST_W, BLAST_H
    c = Canvas(w, h)
    rng = np.random.default_rng(7)
    ys, xs = np.mgrid[0:h, 0:w]
    dens = np.zeros((h, w))
    length = [90, 185, 190, 175, 160][frame_]
    lift = [0, 0, 0, 30, 55][frame_]                                     # the cloud rises as it fades
    strength = [1.0, 1.0, 0.9, 0.62, 0.32][frame_]
    width = [0.7, 0.9, 1.05, 1.2, 1.3][frame_]
    start = [0, 0, 0, 0.4, 0.55][frame_]                               # the jet has stopped at the nozzle
    for i in range(48):
        t = i / 47
        if t < start:
            continue
        y = h - 2 - t * length - lift
        r = (2.5 + t * 22 + rng.uniform(0, 4) * t) * width
        x = w / 2 + rng.uniform(-1.5, 1.5) * t * 4
        dens = np.maximum(dens, (1 - np.hypot(xs - x, (ys - y) * 1.15) / r).clip(0) * strength)
    if frame_ >= 3:
        dens = dens.clip(0, 0.5)                                          # a soft cloud, no dense core left
    lvl = np.digitize(dens, [0.08, 0.3, 0.55])                           # 0 none, 1 thin, 2 mid, 3 dense
    for k, (col, al) in enumerate([(FOG[0], 110), (FOG[1], 190), (FOG[2], 245)], start=1):
        m = lvl == k
        if frame_ >= 3 and k == 1:
            m &= (xs + ys) % 2 == 0
        c.a[m] = rgb(col) + [al]
    return c


# ---------- previews ----------

def scaled(c, s=2):
    im = Image.fromarray(c.a, 'RGBA')
    return im.resize((im.width * s, im.height * s), Image.NEAREST)


def add_glow(base, src, x, y):
    """Additive blend, like Phaser's ADD mode."""
    s = np.array(src).astype(int); b = np.array(base).astype(int)
    h, w = s.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(b.shape[1], x + w), min(b.shape[0], y + h)
    if x1 <= x0 or y1 <= y0:
        return
    ss = s[y0 - y:y1 - y, x0 - x:x1 - x]
    a = ss[..., 3:4] / 255
    b[y0:y1, x0:x1, :3] = (b[y0:y1, x0:x1, :3] + ss[..., :3] * a * 0.8).clip(0, 255)
    base.paste(Image.fromarray(b.astype(np.uint8), 'RGBA'))


def place_light(im, x, angle, colour):
    """One fixture hanging at art x with its head and beam turned by angle (degrees, 0 = straight down)."""
    yoke = Image.fromarray(light_yoke().a, 'RGBA')
    head = Image.fromarray(light_head(True).a, 'RGBA')
    by = 30
    piv = (x, by + YOKE_PIVOT[1])
    bm = Image.fromarray(beam(BEAMS[colour]).a, 'RGBA')
    big = Image.new('RGBA', (BEAM_H * 2, BEAM_H * 2))
    big.paste(bm, (BEAM_H - BEAM_W // 2, BEAM_H))
    big = big.rotate(angle, resample=Image.NEAREST, center=(BEAM_H, BEAM_H))
    add_glow(im, big, piv[0] - BEAM_H, piv[1] + 6 - BEAM_H)
    im.alpha_composite(yoke, (x - YOKE_PIVOT[0], by))
    hd = Image.new('RGBA', (40, 40)); hd.paste(head, (20 - HEAD_PIVOT[0], 20 - HEAD_PIVOT[1]))
    hd = hd.rotate(angle, resample=Image.NEAREST, center=(20, 20))
    im.alpha_composite(hd, (piv[0] - 20, piv[1] - 20))


def room_with_floor():
    room = Image.fromarray(lounge().a, 'RGBA')
    d = np.array(room); d[FLOOR_Y:, :, :3] = rgb('#30233f'); d[FLOOR_Y:FLOOR_Y + 2, :, :3] = rgb('#d8303a')
    return Image.fromarray(d, 'RGBA')


def scene(room, t, blast, dance):
    """One moment of the party: lights at time t (seconds), blast frame or None, a Boris frame or None."""
    im = room.copy()
    for i, x in enumerate(LIGHT_X):
        ang = SWEEP * np.sin(t * 2 * np.pi / SWEEP_PERIOD + i * 1.3)
        place_light(im, x, ang, LIGHT_COLOURS[i])
    lc = Image.fromarray(co2_cannon().a, 'RGBA'); rc = lc.transpose(Image.FLIP_LEFT_RIGHT)
    for cx, cn in zip(CANNON_X, (lc, rc)):
        im.alpha_composite(cn, (cx - CANNON_W // 2, FLOOR_Y - CANNON_H))
    if dance is not None:
        im.alpha_composite(dance, (320 - dance.width // 2, FLOOR_Y - dance.height))
    if blast is not None:
        bl = Image.fromarray(co2_blast(blast).a, 'RGBA')
        for cx in CANNON_X:
            im.alpha_composite(bl, (cx - BLAST_W // 2, FLOOR_Y - CANNON_H + NOZZLE_Y - BLAST_H))
    return im


def preview(out, hero_dir):
    room = room_with_floor()
    moves = []
    if hero_dir and os.path.isdir(hero_dir):
        moves = [Image.open(os.path.join(hero_dir, f'dance-{i}.png')).convert('RGBA') for i in range(3)]
    pick = lambda i: moves[i] if moves else None
    scene(room, 0.0, None, pick(0)).save(os.path.join(out, 'preview-0.png'))
    scene(room, 1.0, 1, pick(1)).save(os.path.join(out, 'preview-1.png'))
    # Animated: lights sweeping, Boris dancing on the beat, then the cannons go off.
    frames = []
    blasts = [None] * 10 + [0, 1, 1, 1, 2, 2, 3, 3, 4, 4] + [None] * 8
    for f, b in enumerate(blasts):
        t = f * 0.125
        dance = pick([0, 1, 2, 1][(f // 2) % 4]) if moves else None
        frames.append(scene(room, t, b, dance).convert('RGB').resize((640, 360), Image.NEAREST))
    frames[0].save(os.path.join(out, 'preview.gif'), save_all=True, append_images=frames[1:], duration=125, loop=0)
    # Strip of the blast frames.
    strip = Image.new('RGBA', (5 * 104 + 8, 260), tuple(rgb('#221533') + [255]))
    for i in range(5):
        strip.alpha_composite(Image.fromarray(co2_blast(i).a, 'RGBA'), (8 + i * 104, 12))
    strip.save(os.path.join(out, 'preview-blast.png'))


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art/vip-fx'
    hero_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(out, 'dance', 'hero')
    os.makedirs(out, exist_ok=True)
    light_yoke().save(os.path.join(out, 'light-yoke.png'))
    light_head(False).save(os.path.join(out, 'light-head.png'))
    light_head(True).save(os.path.join(out, 'light-head-on.png'))
    for name, ramp in BEAMS.items():
        beam(ramp).save(os.path.join(out, f'beam-{name}.png'))
    cannon = co2_cannon()
    cannon.save(os.path.join(out, 'co2-cannon-left.png'))
    Image.fromarray(cannon.a, 'RGBA').transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(out, 'co2-cannon-right.png'))
    for i in range(5):
        co2_blast(i).save(os.path.join(out, f'co2-blast-{i}.png'))
    preview(out, hero_dir)
    print('saved to', out)


if __name__ == '__main__':
    main()
