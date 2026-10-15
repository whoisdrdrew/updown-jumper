"""Draws Solomun's world background: the wooden beach hut of his Tulum set, wicker lamps and a dancing crowd.

Same rules as world_art.py: drawn at the hero's pixel size (twice the world resolution), #150b22
outline, 3-step ramps lit from the top left. Backgrounds stay darker and lower in contrast than the
sprites. Every layer repeats seamlessly sideways.

Layers (back to front):
  roof.png       the inside of the thatched roof with rafters, tie beams and far lamps (opaque)
  lamps.png      big wicker lamps hanging closer to the camera (transparent)
  crowd-0..3.png the dancing crowd, 4 frames of a loop (transparent)

Run from the repo root:  python3 tools/world_solomun.py   (needs Pillow and numpy)
"""
import os
import random
import numpy as np
from pixelkit import Canvas, OUTLINE, rgb

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'art', 'world', 'solomun')
W, H = 640, 360

# Palette rows (also listed in the style guide).
THATCH = ['#1a0c10', '#2c1612', '#432216', '#5e331c', '#7e4822', '#a4642a']   # dark .. lamp-lit
WOOD = ['#2a140e', '#4e2a16', '#7a4a24', '#a8723a']                           # poles and beams
LAMP = ['#7a2a0e', '#b8501a', '#e0801e', '#f5b04a', '#ffe08a', '#fff4cc']     # wicker .. bulb


def bayer(h, w):
    """2x2 ordered dither threshold (0..1) for the whole canvas."""
    m = np.array([[0.125, 0.625], [0.875, 0.375]])
    return np.tile(m, (h // 2 + 1, w // 2 + 1))[:h, :w]


def hash2(a, b, seed=0):
    v = (a * 374761393 + b * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    v = ((v ^ (v >> 13)) * 1274126177) & 0xFFFFFFFF
    return (v & 0xFFFF) / 65535.0


def put(c, mask, col):
    c.a[mask] = rgb(col) + [255]


def pole(c, x0, y0, x1, y1, r, ramp=WOOD, clip=None):
    """A round wooden pole from (x0,y0) to (x1,y1), radius r, shaded across its width."""
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    dx, dy = x1 - x0, y1 - y0
    L = np.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    px, py = xs + .5 - x0, ys + .5 - y0
    along = px * ux + py * uy
    across = px * -uy + py * ux                  # signed distance from the centre line
    m = (along >= -1) & (along <= L + 1) & (np.abs(across) <= r)
    if clip is not None:
        m &= clip
    # The side whose normal points up-left gets the highlight.
    if -uy * -0.6 + ux * -0.8 < 0:
        across = -across
    t = -across / r                              # -1 on the lit side .. 1 on the shadow side
    idx = np.clip(np.digitize(t, [-0.55, 0.15, 0.7]), 0, 3)
    ramp4 = [ramp[3], ramp[2], ramp[1], ramp[0]]
    for i, col in enumerate(ramp4):
        put(c, m & (idx == i), col)
    # A dark line on both edges.
    edge = m & (np.abs(across) > r - 1)
    put(c, edge, OUTLINE)
    return m


def wicker_lamp(c, cx, top, rx, ry, cord_top=0, shape='barrel', seed=0):
    """A woven lamp hanging on a cord, glowing from inside."""
    cy = top + ry
    for y in range(cord_top, top):
        c.px(cx, y, WOOD[1])
    c.rect(cx - 2, top - 2, 5, 2, WOOD[0])
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    ox, oy = (xs + .5 - cx) / rx, (ys + .5 - cy) / ry
    if shape == 'bulb':        # round, a little wider at the bottom
        body = ox ** 2 / (1 + 0.25 * np.clip(oy, 0, 1)) + oy ** 2 <= 1
    elif shape == 'drop':      # narrow top, round bottom
        body = (ox ** 2) / np.clip((oy + 1.15) / 1.6, 0.05, 1) + oy ** 2 <= 1
    else:                      # barrel: flat top and bottom
        body = (ox ** 2 <= 1 - 0.35 * oy ** 4) & (np.abs(oy) <= 0.92)
    # Light shines from the inside: bright low centre, dark rim, lit a bit more on the top left.
    d = np.hypot(ox * 1.0, (oy - 0.3) * 1.1) + 0.12 * (ox + oy)
    idx = np.clip(np.digitize(d, [0.45, 0.75, 1.0]), 0, 3)
    for i, col in enumerate([LAMP[3], LAMP[2], LAMP[1], LAMP[0]]):
        put(c, body & (idx == i), col)
    # Weave: dark horizontal bands and ribs, little bright gaps where they cross near the middle.
    bandy = ((ys - top) % 4 == 0)
    ribx = (np.round((ox * rx) / 3.0) * 3.0 == np.round(ox * rx)) & (np.abs(xs - cx) % 3 == 0)
    put(c, body & bandy & (idx >= 1), LAMP[0])
    put(c, body & bandy & (idx == 0), LAMP[1])
    put(c, body & ribx & ~bandy & (idx >= 2), LAMP[0])
    gaps = body & ((ys - top) % 4 == 2) & ((xs - cx) % 3 == 1) & (idx == 0)
    put(c, gaps, LAMP[5])
    # Glowing opening at the bottom.
    hole = (np.abs(xs + .5 - cx) <= max(1, rx * 0.45)) & (ys == int(cy + ry * 0.92) - 1)
    put(c, hole & body, LAMP[5])
    # Outline around the lamp only.
    p = np.pad(body, 1)
    n = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    put(c, ~body & n, OUTLINE)
    return cx, cy


# ---------- roof (opaque, scrolls slowly) ----------

PERIOD = 640            # one A-frame per tile: the ridge in the middle, the eaves at both ends
FAR_LAMPS = [(36, 96, 6, 8, 'barrel'), (92, 150, 5, 7, 'bulb'), (150, 58, 7, 9, 'drop'), (206, 122, 6, 8, 'barrel'),
             (262, 40, 5, 7, 'bulb'), (300, 168, 6, 8, 'drop'), (352, 90, 6, 8, 'barrel'), (420, 136, 5, 7, 'bulb'),
             (468, 60, 7, 9, 'drop'), (522, 160, 6, 8, 'barrel'), (580, 104, 5, 7, 'bulb'), (618, 44, 6, 8, 'drop')]


def roof():
    c = Canvas(W, H)
    ys, xs = np.mgrid[0:H, 0:W]
    peak, apex_y, eave_y = W // 2, -30, 330
    slope = (eave_y - apex_y) / peak                       # pixels down per pixel sideways
    left = xs < peak
    # Light: a warm pool around every lamp (far ones in this layer, near ones in front of it).
    light = np.zeros((H, W))
    lamps = [(x, y + ry, 40) for x, y, rx, ry, _ in FAR_LAMPS] + [(x, y + ry, 64) for x, y, rx, ry, _ in NEAR_LAMPS]
    for x, y, r in lamps:
        for k in (-W, 0, W):
            light += np.exp(-(((xs - x - k) ** 2 + (ys - y) ** 2) / r ** 2))
    light = np.clip(light, 0, 1.2)
    # Thatch: short reed strands running down the roof slope on each side of the ridge.
    side = np.where(left, 1, -1)
    strand = np.floor((xs * side + ys / slope) / 2).astype(int)
    seg = np.floor((ys + (strand % 5) * 3) / 7).astype(int)
    noise = (((strand * 73856093) ^ (seg * 19349663)) % 1000) / 1000.0
    v = 0.35 + light * 3.6 + (noise - 0.5) * 0.9 - (ys / H) * 0.9
    v = v + (bayer(H, W) - 0.5) * 0.6
    idx = np.clip(np.floor(v), 0, len(THATCH) - 1).astype(int)
    for i, col in enumerate(THATCH):
        put(c, idx == i, col)
    # Rafters: parallel poles on each side meeting at the ridge, like the hut in Tulum.
    for off, r in ((0, 5), (56, 3), (112, 3), (168, 4), (224, 3), (280, 3)):
        for k in (-W, 0, W):
            pole(c, k + peak - off * 0, apex_y + off * slope, k + peak - peak * 1.2, apex_y + off * slope + peak * 1.2 * slope, r,
                 clip=(xs - k < peak) & (xs - k >= 0))
            pole(c, k + peak, apex_y + off * slope, k + peak + peak * 1.2, apex_y + off * slope + peak * 1.2 * slope, r,
                 clip=(xs - k >= peak) & (xs - k < W))
    # Tie beams across the hut and a leaning trunk holding up the ridge.
    for y, r in ((176, 4), (236, 5)):
        pole(c, -10, y, W + 10, y, r)
    pole(c, peak + 70, -10, peak + 86, H + 10, 5)
    pole(c, 70, -10, 60, H + 10, 4)
    # Rope bindings where the tie beam crosses the posts.
    for x in (peak + 80, 66):
        for dy in (-4, -1, 2):
            c.rect(x - 4, 176 + dy, 9, 1, WOOD[3])
    # Far lamps hang from the roof.
    for x, y, rx, ry, shape in FAR_LAMPS:
        wicker_lamp(c, x, y, rx, ry, cord_top=max(0, y - 40), shape=shape)
    # Lower walls fade to dark behind the crowd.
    for y in range(244, H):
        t = (y - 244) / 30
        dark = (t > 1) | ((t > 0.5) & ((xs[y] + y) % 2 == 0))
        c.a[y, dark] = rgb(THATCH[0]) + [255]
    return c


# ---------- near lamps (transparent, scroll a bit faster) ----------

NEAR_LAMPS = [(70, 40, 11, 14, 'barrel'), (236, 92, 9, 12, 'bulb'), (398, 22, 12, 15, 'drop'),
              (560, 74, 10, 13, 'barrel')]


def near_lamps():
    c = Canvas(W, H)
    for x, y, rx, ry, shape in NEAR_LAMPS:
        wicker_lamp(c, x, y, rx, ry, cord_top=0, shape=shape)
    return c


# ---------- dancing crowd (4 frames, transparent) ----------

SKIN = [['#6f3e3d', '#9c6350', '#c1876c'], ['#4a2a2a', '#6f3e3d', '#9c6350'], ['#9c6350', '#c1876c', '#dc9983']]
HAIR = [['#150b22', '#2a1620', '#3e2421'], ['#2a1612', '#3e2421', '#6b3f2c'], ['#3e2421', '#6b3f2c', '#9a6440'],
        ['#150b22', '#2a1620', '#3e2421'], ['#2a1612', '#3e2421', '#6b3f2c'], ['#5e5763', '#8e8790', '#bdb6bc']]
TOPS = [['#2a2236', '#3e3450', '#5a5068'], ['#3a1e2a', '#5a2e3a', '#7a4a4e'], ['#175f6b', '#208595', '#30c0d4'],
        ['#6a5a4a', '#8a7862', '#b0a088'], ['#5e5763', '#8e8790', '#bdb6bc'], ['#200920', '#354169', '#54455c']]
MOVES = ['pump', 'both', 'sway', 'wave', 'bounce']
STYLES = ['short', 'long', 'curly', 'cap', 'bun', 'long', 'short']


def segment(c, x0, y0, x1, y1, r):
    """Mask of a thick line (an arm)."""
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    dx, dy = x1 - x0, y1 - y0
    t = np.clip(((xs + .5 - x0) * dx + (ys + .5 - y0) * dy) / max(dx * dx + dy * dy, 1e-6), 0, 1)
    return np.hypot(xs + .5 - x0 - t * dx, ys + .5 - y0 - t * dy) <= r


def dancer(c, x, y, look, frame, phase, move, scale=1.0):
    """One background dancer in the hero's chibi build (head as big as the body), head top at (x, y)."""
    f = (frame + phase) % 4
    bob = (0, 2, 0, 2)[f]
    sway = {'sway': (-1, 0, 1, 0)[f], 'both': (-1, 0, 1, 0)[f], 'wave': (0, -1, 0, 1)[f]}.get(move, 0)
    skin, hair, top, style, shades = look
    hr = 10 * scale                                  # head 20 px, half the dancer like the hero
    cx, cy = x + sway, y + hr + bob
    bw = 22 * scale                                  # shoulders as wide as the head
    st = cy + hr - 1                                 # shoulder line
    p = Canvas(c.w, c.h)
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    # Hands for this frame, relative to the shoulders.
    hands = []
    if move == 'pump':
        s1 = 1 if phase % 2 else -1
        hands = [(s1, s1 * 5, (-27, -19, -27, -19)[f]), (-s1, -s1 * 4, 9)]
    elif move == 'both':
        hands = [(-1, -13, -22 + (0, 2, 0, 2)[f]), (1, 13, -22 + (2, 0, 2, 0)[f])]
    elif move == 'wave':
        hx = (-12, -4, 6, 12)[f] if phase % 2 else (12, 4, -6, -12)[f]
        hands = [(1, hx, -24 + abs(hx) // 4), (-1, -6, 7)]
    else:                                            # arms bent at the chest, bopping
        hands = [(-1, -6, 6 - bob), (1, 6, 4 + bob)]
    arm_masks = []
    for sd, hx, hy in hands:
        sx_, sy_ = cx + sd * (bw / 2 - 2.5), st + 3
        hx_, hy_ = cx + hx * scale, st + hy * scale
        arm_masks.append((segment(p, sx_, sy_, hx_, hy_, 1.6 * scale + 0.3), p.ellipse_mask(hx_, hy_, 2.4 * scale + .2, 2.4 * scale + .2), hy < 0))
    # Raised arms behind the head, so draw them first.
    for am, hm, up in arm_masks:
        if up:
            put(p, am, skin[1]); put(p, hm, skin[2])
    # Body: tank top with round shoulders.
    body = (p.ellipse_mask(cx, st + 6, bw / 2, 7) | ((ys >= st + 6) & (np.abs(xs + .5 - cx) <= bw / 2 - 0.5))) & (ys < st + 34)
    t = (xs + .5 - (cx - bw / 2)) / bw + (ys - st) / 40
    for i, col in enumerate(top[::-1]):
        put(p, body & (np.digitize(t, [0.32, 0.78]) == i), col)
    # Bare shoulders and neck above a tank top.
    neck = p.ellipse_mask(cx, st + 1, 3.5 * scale, 3)
    put(p, neck, skin[0])
    # Head, lit from the top left.
    rx = hr * 1.05
    head = p.ellipse_mask(cx, cy, rx, hr)
    p.shade(head, cx, cy, rx, hr, skin, cuts=(-0.15, 0.5))
    # Hair: 2-3 clumps.
    if style == 'cap':
        capm = p.ellipse_mask(cx, cy - hr * 0.35, rx * 1.02, hr * 0.75) & (ys < cy - hr * 0.2)
        p.shade(capm, cx, cy - hr * 0.5, rx, hr * 0.6, ['#3e3450', '#5a5068', '#8e8790'], cuts=(-0.2, 0.5))
        put(p, (ys == int(cy - hr * 0.2)) & (xs >= cx - rx - 3) & (xs <= cx + rx * 0.6), '#2a2236')
    else:
        hairm = p.ellipse_mask(cx, cy - hr * 0.3, rx * 1.1, hr * 0.85) & (ys < cy - hr * 0.15)
        if style == 'long':
            hairm |= p.ellipse_mask(cx, cy + hr * 0.1, rx * 1.15, hr * 1.1) & ~head & (ys < cy + hr * 0.95)
            hairm |= head & (np.abs(xs + .5 - cx) > rx * 0.72) & (ys < cy + hr * 0.6)
        elif style == 'curly':
            for dx_ in (-0.85, 0, 0.85):
                hairm |= p.ellipse_mask(cx + dx_ * rx, cy - hr * (0.7 if dx_ else 0.95), rx * 0.5, hr * 0.45)
        elif style == 'bun':
            hairm |= p.ellipse_mask(cx + rx * 0.15, cy - hr * 1.12, rx * 0.4, hr * 0.35)
        p.shade(hairm, cx, cy - hr * 0.5, rx * 1.1, hr * 0.8, hair, cuts=(-0.25, 0.45))
        # A clump line or two so the hair reads as clumps, not a helmet.
        put(p, hairm & (ys == int(cy - hr * 0.15)) & ((xs - int(cx)) % 7 == 3), hair[0])
    # Face: happy closed eyes, or sunglasses (faces stay tiny in the background).
    ey = int(cy + hr * 0.2)
    if shades:
        p.rect(int(cx - rx * 0.6), ey - 1, int(rx * 1.2) + 1, 2, OUTLINE)
    else:
        for ex in (int(cx - rx * 0.45), int(cx + rx * 0.25)):
            p.rect(ex, ey, 2, 1, OUTLINE)
    # Arms that are down or bent go in front of the body.
    for am, hm, up in arm_masks:
        if not up:
            put(p, am, skin[1]); put(p, hm, skin[2])
    p.outline()
    c.paste(p, 0, 0)


def crowd(frame):
    M = 40                                           # margin; whatever spills over wraps to the other side
    c = Canvas(W + 2 * M, H)
    for row, (base, step, scale, seed) in enumerate(((196, 30, 0.85, 3), (214, 36, 1.0, 9))):
        rnd = random.Random(seed)
        if row == 1:                                 # the back row sits in the shade
            m = c.a[..., 3] > 0
            c.a[m, :3] = (c.a[m, :3] * 0.62 + np.array(rgb(THATCH[0])) * 0.38).astype(np.uint8)
        x = M + 8 + row * 17
        while x < M + W - 10:
            move = rnd.choice(MOVES)
            phase = rnd.randint(0, 3)
            jitter = rnd.randint(-3, 4)
            look = (rnd.choice(SKIN), rnd.choice(HAIR), rnd.choice(TOPS), rnd.choice(STYLES), rnd.random() < 0.2)
            dancer(c, x, base + jitter, look, frame, phase, move, scale)
            x += step + rnd.randint(-4, 6)
    m = c.a[..., 3] > 0                              # the whole crowd a little darker than the sprites
    c.a[m, :3] = (c.a[m, :3] * 0.85 + np.array(rgb(THATCH[0])) * 0.15).astype(np.uint8)
    out = Canvas(W, H)
    out.a[:] = c.a[:, M:M + W]
    for src, dst in ((slice(0, M), slice(W - M, W)), (slice(M + W, W + 2 * M), slice(0, M))):
        piece = c.a[:, src]
        m = piece[..., 3] > 0
        out.a[:, dst][m] = piece[m]
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    roof().save(os.path.join(OUT, 'roof.png'))
    near_lamps().save(os.path.join(OUT, 'lamps.png'))
    for f in range(4):
        crowd(f).save(os.path.join(OUT, f'crowd-{f}.png'))
    print('saved to', os.path.normpath(OUT))


if __name__ == '__main__':
    main()
