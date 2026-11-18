"""Draws the playable DJs (levels 2-10) and their end bosses from Boris's own pose pictures.

Every playable DJ moves exactly like Boris (rule from 2026-10-27), so his look is painted onto Boris's
bare pose frames (src/art/hero-bare/ and hero-big-bare/): same size, same poses, same feet. Only the
look changes: skin, hair, beard, glasses or hat, top, trousers, shoes. The face keeps the hero's
chibi build (style guide sections 2 and 2b).

The boss is a separate design of the same person: the big poses, widened through the body (the head
stays hero size, all the extra size goes into shoulders, arms and legs, style guide section 2), plus
his own props for his attack.

Out, per DJ <id> (the spec below):
  src/art/<id>/playable/hero/{idle,run,jump,sit}.png       44x52 (sit 31x50), like Boris
  src/art/<id>/playable/hero-big/{idle,run,jump,sit}.png   44x66 (sit 36x64)
  src/art/<id>/{idle,attack,defeat,photo-pose}.png         the boss, ~1.3x taller and ~1.5x wider
  src/art/<id>/portrait.png                                37x30, top bar and Line-Up
  src/art/<id>/<prop>.png                                  his attack props
  src/art/bonus/portrait-<id>.png                          288x224, the VIP room picture
  /mnt/project-files/art/<id>/preview.png                  Boris next to the DJ and his boss

This is a first pass made in code so all nine DJs exist and play. Each one can be redrawn later with
the Higgsfield route in the style guide; the file names stay the same.

Run from the repo root:  python3 tools/dj_art.py [id ...]   (needs Pillow and numpy)
"""
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ART = os.path.join(ROOT, 'src', 'art')
PREVIEWS = '/mnt/project-files/art'
OUTLINE = (0x15, 0x0b, 0x22)


def hx(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


# Boris's colours, by what they are.
SKIN = ['#6f3e3d', '#9c6350', '#c1876c', '#dc9983', '#f1b9a3', '#f4cab8']  # dark .. light
SKIN_EXTRA = {'#9a655b': 1, '#fae8bf': 5, '#c3afac': 4, '#d2905e': 3}
SHIRT = {'#18151d': 0, '#201d26': 0, '#2a2731': 1, '#54455c': 2, '#30233f': 1, '#221533': 0}
PANTS = {'#4a4954': 0, '#64636e': 0, '#868591': 1, '#a6a5b0': 2, '#a396a6': 2, '#827788': 1, '#6f6379': 0}
GOLD = {'#e0931a', '#f7ce12', '#fae8bf'}
WHITE = '#fdfefd'
DARK = {'#0e0413', '#150b22', '#200920'}

SKIN_RAMPS = {
    'light': SKIN,
    'tan': ['#5e3426', '#8a5536', '#b07650', '#cc8e66', '#e0a882', '#ecc0a0'],
    'dark': ['#26130e', '#3c2116', '#55301f', '#6e4029', '#8a5535', '#a06a45'],
}

# The DJs. Colours: shadow, base, light. Everything not listed stays like Boris.
DJS = {
    'miss-monique': {
        'name': 'MISS MONIQUE', 'skin': 'light', 'smooth': True,
        'hair': {'ramp': ['#7a5530', '#b48a52', '#e2c486'], 'long': 12, 'volume': 2, 'fringe': 1},
        'shirt': ['#0e0413', '#221533', '#3a2c4a'], 'pants': ['#0e0413', '#221533', '#30233f'],
        'boss': {'props': ['vinyl'], 'bg': ['#2a1a3a', '#ff7a4a', '#ffd06a']},
    },
    'marshmello': {
        'name': 'MARSHMELLO', 'skin': 'light', 'helmet': True,
        'shirt': ['#0e0413', '#221533', '#30233f'], 'pants': ['#0e0413', '#221533', '#30233f'],
        'boss': {'props': ['marshmallow'], 'bg': ['#1a1a2a', '#f08a3a', '#fff4e0']},
    },
    'dom-dolla': {
        'name': 'DOM DOLLA', 'skin': 'tan', 'beard': {'ramp': ['#2a1812', '#3e2421'], 'style': 'moustache'},
        'hair': {'ramp': ['#1e120e', '#3e2421', '#6b3f2c'], 'volume': 3, 'fringe': -1, 'back': 0},
        'shirt': ['#b8b6c0', '#e8e6ee', '#fdfefd'], 'pants': ['#1e1a2a', '#2e2a40', '#46405c'],
        'boss': {'props': ['discoball'], 'bg': ['#16203a', '#c46ad8', '#ffe08a']},
    },
    'steve-aoki': {
        'name': 'STEVE AOKI', 'skin': 'tan', 'beard': {'ramp': ['#0e0413', '#221a20'], 'style': 'goatee'},
        'hair': {'ramp': ['#0e0413', '#1e1620', '#3a3040'], 'long': 9, 'volume': 3, 'fringe': 2},
        'shirt': ['#0e0413', '#221533', '#30233f'], 'logo': '#fdfefd', 'pants': ['#0e0413', '#221533', '#30233f'],
        'boss': {'props': ['cake'], 'bg': ['#2a1626', '#ff6aa8', '#fff4cc']},
    },
    'john-summit': {
        'name': 'JOHN SUMMIT', 'skin': 'light',
        'hair': {'ramp': ['#1e120e', '#3e2421', '#6b3f2c'], 'volume': 2, 'fringe': 0, 'back': 0},
        'shirt': ['#b8b6c0', '#e8e6ee', '#fdfefd'], 'pants': ['#200920', '#354169', '#54628c'],
        'boss': {'props': ['snowball'], 'bg': ['#1a2a4a', '#f0b04a', '#fdfefd']},
    },
    'charlotte-de-witte': {
        'name': 'CHARLOTTE DE WITTE', 'skin': 'light', 'smooth': True,
        'hair': {'ramp': ['#5a3e26', '#9a7448', '#d4b07a'], 'long': 13, 'volume': 1, 'fringe': 0},
        'shirt': ['#0e0413', '#221533', '#30233f'], 'pants': ['#0e0413', '#1a1426', '#2a2236'],
        'shoes': ['#0e0413', '#221533', '#3a2c4a'],
        'boss': {'props': ['shockwave'], 'bg': ['#140a14', '#c0202a', '#ff4a3a']},
    },
    'fisher': {
        'name': 'FISHER', 'skin': 'light', 'chain': True,
        'hat': {'kind': 'bucket', 'ramp': ['#a8a6b0', '#e2e0e8', '#fdfefd']},
        'glasses': {'kind': 'white'},
        'shirt': ['#3a8a1a', '#6ad02a', '#a8f04a'], 'pattern': '#f7ce12', 'pants': ['#0e0413', '#221533', '#30233f'],
        'boss': {'props': ['hook'], 'bg': ['#0e3a4a', '#2ab8b0', '#fae8bf']},
    },
    'james-hype': {
        'name': 'JAMES HYPE', 'skin': 'light', 'beard': {'ramp': ['#1e120e', '#3e2421'], 'style': 'full'},
        'hair': {'ramp': ['#c8b070', '#e8d8a0', '#fdf4d0'], 'volume': 1, 'fringe': -1, 'back': -1},
        'shirt': ['#0e0413', '#221533', '#30233f'], 'pants': ['#0e0413', '#221533', '#30233f'],
        'boss': {'props': ['soundwave'], 'bg': ['#1a0a10', '#d02a2a', '#ff9a6a']},
    },
    'carl-cox': {
        'name': 'CARL COX', 'skin': 'dark', 'glasses': {'kind': 'shades'},
        'shirt': ['#0e0413', '#221533', '#30233f'], 'logo': '#c0202a', 'pants': ['#1e1a22', '#3a3640', '#56525c'],
        'boss': {'props': ['roadster'], 'bg': ['#3a1a10', '#e06a2a', '#ffd06a'], 'wide': 1.7},
    },
}


def load(path):
    a = np.array(Image.open(path).convert('RGBA'))
    return a


def hexof(p):
    return '#%02x%02x%02x' % tuple(p[:3])


def neighbours_transparent(alpha):
    p = np.pad(alpha, 1)
    return ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])


class Frame:
    """One pose picture of Boris, split into head, torso, legs."""

    def __init__(self, a):
        self.a = a.copy()
        self.h, self.w = a.shape[:2]
        alpha = a[..., 3] > 0
        cols = np.array([[hexof(a[y, x]) if alpha[y, x] else '' for x in range(self.w)] for y in range(self.h)])
        self.cols = cols
        shirt = np.isin(cols, list(SHIRT))
        gold = np.isin(cols, ['#e0931a', '#f7ce12'])
        ys = np.where((shirt.sum(axis=1) >= 4) | (gold.sum(axis=1) >= 2))[0]
        self.collar = int(ys.min()) if len(ys) else self.h // 2
        pants = np.isin(cols, list(PANTS))
        yp = np.where(pants.any(axis=1))[0]
        self.belt = int(yp.min()) if len(yp) else int(self.h * 0.75)
        # The head: what is connected to the top-most pixel above the collar.
        top = np.argwhere(alpha)[0]
        head = np.zeros_like(alpha)
        stack = [tuple(top)]
        while stack:
            y, x = stack.pop()
            if y < 0 or x < 0 or y >= self.collar or x >= self.w or head[y, x] or not alpha[y, x]:
                continue
            head[y, x] = True
            stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
        # Keep it head-sized (a raised fist can touch it): 26 px across, centred on the crown.
        crown = np.where(head[top[0]:top[0] + 4].any(axis=0))[0]
        mid = (crown.min() + crown.max()) // 2
        hw = np.where(head.any(axis=0))[0]
        left = max(hw.min(), mid - 14)
        head[:, :left] = False
        head[:, left + 26:] = False
        self.head = head
        hy, hxs = np.where(head)
        self.top, self.x0, self.x1 = int(hy.min()), int(hxs.min()), int(hxs.max())
        whites = np.argwhere(head & (cols == WHITE))
        if len(whites):
            self.eye_y = int(round(whites[:, 0].mean()))
            self.eye_x0, self.eye_x1 = int(whites[:, 1].min()), int(whites[:, 1].max())
        else:
            self.eye_y = self.top + int((self.collar - self.top) * 0.55)
            self.eye_x0, self.eye_x1 = self.x1 - 9, self.x1 - 2
        self.front = self.x0 + int((self.x1 - self.x0) * 0.5)

    def put(self, y, x, c):
        if 0 <= y < self.h and 0 <= x < self.w:
            self.a[y, x] = list(hx(c)) + [255]
            self.cols[y, x] = c

    def recolor(self, mask, mapping):
        for y, x in np.argwhere(mask):
            c = self.cols[y, x]
            if c in mapping:
                self.put(y, x, mapping[c])


def paint_dj(fr, spec):
    cols = fr.cols
    region = np.zeros((fr.h, fr.w), bool)
    torso = region.copy()
    torso[fr.collar - 1:, :] = True
    legs = region.copy()
    legs[fr.belt:, :] = True

    # Skin everywhere (face, arms, hands).
    ramp = SKIN_RAMPS[spec['skin']]
    skin_map = {c: ramp[i] for i, c in enumerate(SKIN)}
    skin_map.update({c: ramp[i] for c, i in SKIN_EXTRA.items()})
    fr.recolor(fr.head, skin_map)
    fr.recolor(~fr.head & (np.isin(cols, list(SKIN)) | np.isin(cols, ['#9a655b', '#d2905e'])), skin_map)

    # Top: Boris's black tee in the DJ's colours; the gold chain stays only if he wears one.
    sh = spec['shirt']
    fr.recolor(torso, {c: sh[i] for c, i in SHIRT.items()})
    # Boris's tee has near-black folds; on a light top they become its shadow colour.
    if hx(sh[1])[0] > 0x80:
        alpha = fr.a[..., 3] > 0
        inner = torso & ~neighbours_transparent(alpha) & np.isin(fr.cols, ['#0e0413'])
        for y, x in np.argwhere(inner):
            near = [fr.cols[y + dy, x + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if sum(c in sh or c in SHIRT for c in near) >= 2:
                fr.put(y, x, sh[0])
    if not spec.get('chain'):
        fr.recolor(torso & ~legs, {c: sh[1] for c in GOLD})  # the chain
    if spec.get('pattern'):
        for y, x in np.argwhere(torso & np.isin(fr.cols, [sh[1], sh[2]])):
            if (x * 3 + y * 5) % 7 == 0:
                fr.put(y, x, spec['pattern'])
    if spec.get('logo'):
        # A small print on the chest, 3x2, a little in front of the middle.
        cy = fr.collar + 5
        tor = np.argwhere(torso & (fr.cols == sh[1]))
        if len(tor):
            cx = int(np.median(tor[:, 1])) + 1
            for dy in range(2):
                for dx in range(3):
                    if fr.cols[cy + dy, cx + dx] in (sh[0], sh[1], sh[2]):
                        fr.put(cy + dy, cx + dx, spec['logo'])

    # Trousers, and the gold stripe down them becomes trouser colour.
    pa = spec['pants']
    fr.recolor(legs, {c: pa[i] for c, i in PANTS.items()})
    fr.recolor(legs, {c: pa[1] for c in GOLD})
    if spec.get('shoes'):
        so = spec['shoes']
        fr.recolor(legs, {WHITE: so[2], '#cfcdcd': so[1], '#452c3b': so[0], '#54455c': so[1]})

    if spec.get('smooth'):
        low = fr.head.copy()
        low[: fr.eye_y + 2, :] = False
        low[:, : fr.front - 2] = False
        fr.recolor(low, {ramp[1]: ramp[3], ramp[2]: ramp[3]})

    if spec.get('helmet'):
        helmet(fr)
        return fr
    if spec.get('beard'):
        beard(fr, spec['beard'], ramp)
    if spec.get('hair'):
        hair(fr, spec['hair'])
    if spec.get('hat'):
        hat(fr, spec['hat'])
    if spec.get('glasses'):
        glasses(fr, spec['glasses'])
    return fr


def outline_new(fr, mask):
    """Pixels of mask next to transparency become the outline colour."""
    alpha = fr.a[..., 3] > 0
    edge = mask & neighbours_transparent(alpha)
    for y, x in np.argwhere(edge):
        fr.put(y, x, '#150b22')


def hair(fr, spec):
    ramp = spec['ramp']
    alpha = fr.a[..., 3] > 0
    yy, xx = np.mgrid[0:fr.h, 0:fr.w]
    # Hairline: above the brow in front, down to the ear at the back.
    brow = fr.eye_y - 4 + spec.get('fringe', 0)
    back_line = fr.eye_y + spec.get('back', 1)
    split = fr.eye_x0 - 2
    line = np.where(xx >= split, brow, np.where(xx >= fr.x0 + 5, brow + (split - xx) // 2, back_line))
    line = np.minimum(line, back_line)
    m = fr.head & (yy <= line)
    # Volume: grow up and back into empty space.
    v = spec.get('volume', 2)
    grown = m.copy()
    for d in range(1, v + 1):
        up = np.zeros_like(m)
        up[:-d, :] = m[d:, :]
        grown |= up & ~alpha & (xx > fr.x0 - 1) & (xx < fr.x1)
    back = np.zeros_like(m)
    back[:, :-1] = grown[:, 1:]
    grown |= back & ~alpha
    # Long hair falls behind the shoulders on the back side.
    long_ = spec.get('long', 0)
    if long_:
        col_l, col_r = fr.x0 - 1, fr.x0 + int((fr.x1 - fr.x0) * 0.42)
        for y in range(back_line - 2, min(fr.collar + long_, fr.h - 1)):
            taper = max(0, (y - fr.collar) // 3)
            for x in range(col_l + taper // 2, col_r - taper):
                if not alpha[y, x] or (fr.head[y, x] and x < col_r - 1):
                    grown[y, x] = True
        # A lock in front over the shoulder.
        for y in range(back_line, min(fr.collar + long_ // 2, fr.h - 1)):
            x = fr.x1 - 4
            if 0 <= x < fr.w and not fr.head[y, x] and y >= fr.collar - 1:
                pass
    keep_face = fr.head & (yy > line) & (xx >= split)
    grown &= ~keep_face
    for y, x in np.argwhere(grown):
        fr.put(y, x, ramp[1])
    # Shading: light on the top-left rows, shadow at the hairline and at the back.
    ys = np.where(grown.any(axis=1))[0]
    top = ys.min()
    for y, x in np.argwhere(grown):
        if y <= top + 1 and x < fr.front + 2:
            fr.put(y, x, ramp[2])
        elif (y + 1 < fr.h and keep_face[y + 1, x]) or x <= fr.x0 + 1 or y > back_line:
            fr.put(y, x, ramp[0])
    # Two clumps: a darker parting line.
    px = fr.x0 + (fr.x1 - fr.x0) // 3
    for y in range(top + 2, min(top + 6, fr.h)):
        if grown[y, px]:
            fr.put(y, px, ramp[0])
    outline_new(fr, grown)


def beard(fr, spec, skin):
    ramp = spec['ramp']
    yy, xx = np.mgrid[0:fr.h, 0:fr.w]
    style = spec['style']
    mouth = fr.eye_y + 5
    if style == 'full':
        m = fr.head & (yy >= fr.eye_y + 3) & (xx >= fr.x0 + 4)
    elif style == 'goatee':
        m = fr.head & (yy >= mouth - 1) & (xx >= fr.eye_x0 + 1)
    else:  # moustache
        m = fr.head & (yy == mouth - 1) & (xx >= fr.eye_x0 + 3) & (xx <= fr.x1 - 2)
    m &= ~np.isin(fr.cols, list(DARK))
    for y, x in np.argwhere(m):
        fr.put(y, x, ramp[1] if (y + x) % 5 else ramp[0])
    # Keep the mouth line readable.
    for y, x in np.argwhere(fr.head & (yy == mouth) & (xx >= fr.eye_x0 + 2) & (xx <= fr.x1 - 3)):
        if style != 'moustache':
            fr.put(y, x, ramp[0])


def hat(fr, spec):
    ramp = spec['ramp']
    brim_y = fr.eye_y - 5
    m = np.zeros((fr.h, fr.w), bool)
    for y in range(max(0, fr.top - 3), brim_y):
        for x in range(fr.x0 + 1, fr.x1):
            m[y, x] = True
    # Round the crown.
    for d in range(3):
        m[fr.top - 3 + d, fr.x0 + 1: fr.x0 + 4 - d] = False
        m[fr.top - 3 + d, fr.x1 - 3 + d: fr.x1] = False
    for y in range(brim_y, brim_y + 2):
        for x in range(fr.x0 - 2, fr.x1 + 3):
            m[y, x] = True
    for y, x in np.argwhere(m):
        fr.put(y, x, ramp[1])
    for y, x in np.argwhere(m):
        if y >= brim_y + 1 or x <= fr.x0 + 1:
            fr.put(y, x, ramp[0])
        elif y <= fr.top - 2 and x < fr.front:
            fr.put(y, x, ramp[2])
    outline_new(fr, m)


def glasses(fr, spec):
    kind = spec['kind']
    y0 = fr.eye_y - 1
    x0, x1 = fr.eye_x0 - 1, min(fr.x1 - 1, fr.eye_x1 + 2)
    frame = '#fdfefd' if kind == 'white' else '#150b22'
    for x in range(x0, x1 + 1):
        if not fr.head[y0, x]:
            continue
        fr.put(y0 - 1, x, frame)
        fr.put(y0, x, '#150b22')
        fr.put(y0 + 1, x, '#2a2240' if kind != 'white' else '#150b22')
        if kind == 'white':
            fr.put(y0 + 2, x, frame)
    fr.put(y0, x0 + 1, '#6f6379')  # one glint
    for x in range(x0 - 4, x0):  # the arm back to the ear
        if fr.head[y0, x]:
            fr.put(y0 - 1, x, frame)


def helmet(fr):
    """Marshmello: the whole head is the white marshmallow helmet with X eyes and a wide smile."""
    x0, x1, top, bot = fr.x0, fr.x1, fr.top - 1, fr.collar
    m = np.zeros((fr.h, fr.w), bool)
    m[max(0, top):bot, x0:x1 + 1] = True
    for d in range(2):
        for (yy, xs) in [(top + d, [x0, x0 + 1 - d, x1, x1 - 1 + d]), (bot - 1 - d, [x0, x0 + 1 - d, x1, x1 - 1 + d])]:
            for x in xs:
                if 0 <= yy < fr.h:
                    m[yy, x] = False
    fr.head = m
    for y, x in np.argwhere(m):
        fr.put(y, x, '#e8e6ee')
    for y, x in np.argwhere(m):
        if x <= x0 + 2 or y >= bot - 2:
            fr.put(y, x, '#b8b6c0')
        elif y <= top + 2 and x < (x0 + x1) // 2:
            fr.put(y, x, '#fdfefd')
    # Lines of the marshmallow's top.
    for x in range(x0 + 2, x1 - 1):
        fr.put(top + 4, x, '#cfcdcd')
    outline_new(fr, m)
    ey = fr.eye_y
    cx = (fr.eye_x0 + fr.x1) // 2 + 1
    for ex in (cx - 4, cx + 2):
        for d in (-1, 0, 1):
            fr.put(ey + d, ex + d, '#150b22')
            fr.put(ey + d, ex - d, '#150b22')
    # Smile: a wide curve.
    sy = ey + 4
    for x in range(cx - 6, cx + 5):
        fr.put(sy + (1 if cx - 5 <= x <= cx + 3 else 0), x, '#150b22')


# ---------------------------------------------------------------------------------- bosses

def widen(a, factor, head_rows):
    """Wider through the body: columns below the head are repeated so the body gets `factor` wider; the
    head keeps its size and sits centred on the shoulders."""
    h, w = a.shape[:2]
    nw = int(round(w * factor)) + 2
    out = np.zeros((h, nw, 4), np.uint8)
    # Body: nearest-neighbour stretch of every row below the head.
    src = np.minimum((np.arange(nw) - 1) / factor, w - 1).astype(int)
    body = a[:, src]
    out[head_rows:] = body[head_rows:]
    # Head: unchanged, centred on the body's middle.
    alpha = a[..., 3] > 0
    xs = np.where(alpha[:head_rows].any(axis=0))[0]
    hb = np.where(alpha[head_rows:].any(axis=0))[0]
    body_mid = (hb.min() + hb.max()) / 2 if len(hb) else w / 2
    off = int(round(body_mid * factor + 1 - body_mid))
    for y in range(head_rows):
        for x in xs:
            if alpha[y, x] and 0 <= x + off < nw:
                out[y, x + off] = a[y, x]
    # The rows just under the chin keep the head's pixels where the stretched body is empty.
    return out


def crop(a):
    alpha = a[..., 3] > 0
    ys, xs = np.where(alpha)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def pad_to(a, w, h, bottom=True):
    out = np.zeros((h, w, 4), np.uint8)
    ah, aw = a.shape[:2]
    x = (w - aw) // 2
    y = h - ah if bottom else (h - ah) // 2
    out[max(0, y):max(0, y) + min(ah, h), max(0, x):max(0, x) + min(aw, w)] = a[max(0, -y):max(0, -y) + min(ah, h), max(0, -x):max(0, -x) + min(aw, w)]
    return out


def save(a, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(a, 'RGBA').save(path)


def boss_pose(spec, pose, factor):
    fr = Frame(load(os.path.join(ART, 'hero-big-bare', f'{pose}.png')))
    head_rows = fr.collar
    paint_dj(fr, spec)
    big = widen(fr.a, factor, head_rows)
    return crop(big), fr


def portrait(a, fr):
    """37x30: the head and the top of the shoulders, like solomun/portrait.png."""
    top = max(0, fr.top - 4)
    c = a[top:top + 30]
    alpha = c[..., 3] > 0
    xs = np.where(alpha.any(axis=0))[0]
    mid = (fr.x0 + fr.x1) // 2
    x0 = max(0, mid - 18)
    c = c[:, x0:x0 + 37]
    return pad_to(c, 37, 30, bottom=True)


# Props for the attacks, drawn at the hero's pixel size.
def prop(kind):
    from pixelkit import Canvas
    if kind == 'vinyl':
        c = Canvas(18, 18)
        c.fill(c.ellipse_mask(9, 9, 8, 8), '#150b22')
        c.fill(c.ellipse_mask(9, 9, 7, 7), '#2a2240')
        c.fill(c.ellipse_mask(9, 9, 5, 5), '#3a3050')
        c.fill(c.ellipse_mask(9, 9, 3, 3), '#ff7a4a')
        c.fill(c.ellipse_mask(9, 9, 1, 1), '#150b22')
        c.px(5, 5, '#8a80a0'); c.px(6, 4, '#8a80a0')
        return {'vinyl': c.a}
    if kind == 'marshmallow':
        c = Canvas(14, 14)
        c.rect(2, 2, 10, 10, '#e8e6ee')
        c.rect(2, 2, 10, 2, '#fdfefd')
        c.rect(2, 10, 10, 2, '#cfcdcd')
        c.rect(2, 3, 2, 8, '#cfcdcd')
        c.outline('#150b22')
        out = {'marshmallow': c.a}
        f = Canvas(14, 14)  # a toasted one, on fire
        f.rect(2, 4, 10, 8, '#c08a5a')
        f.rect(2, 4, 10, 2, '#e0b07a')
        f.rect(4, 0, 6, 4, '#f5b04a')
        f.rect(5, 1, 4, 2, '#ffe08a')
        f.outline('#150b22')
        out['marshmallow-fire'] = f.a
        return out
    if kind == 'discoball':
        c = Canvas(18, 18)
        m = c.ellipse_mask(9, 9, 8, 8)
        c.shade(m, 9, 9, 8, 8, ['#4a4954', '#868591', '#cfcdcd', '#fdfefd'])
        for y in range(2, 17, 3):
            for x in range(1, 18):
                if m[y, x]:
                    c.px(x, y, '#54455c')
        for x in range(2, 17, 3):
            for y in range(1, 18):
                if m[y, x]:
                    c.px(x, y, '#54455c')
        c.px(6, 5, '#fdfefd'); c.px(5, 6, '#fdfefd')
        c.outline('#150b22')
        return {'discoball': c.a}
    if kind == 'cake':
        c = Canvas(18, 14)
        c.rect(1, 5, 16, 8, '#f6b8c8')
        c.rect(1, 5, 16, 2, '#fdfefd')
        c.rect(1, 11, 16, 2, '#db6684')
        for x in (3, 7, 11, 15):
            c.rect(x, 7, 1, 2, '#fdfefd')
        c.rect(8, 1, 2, 4, '#f5b04a')
        c.px(8, 0, '#ffe08a')
        c.outline('#150b22')
        return {'cake': c.a}
    if kind == 'snowball':
        c = Canvas(14, 14)
        m = c.ellipse_mask(7, 7, 6, 6)
        c.shade(m, 7, 7, 6, 6, ['#9a96b6', '#cfd8ec', '#fdfefd'])
        c.outline('#150b22')
        return {'snowball': c.a}
    if kind == 'shockwave':
        c = Canvas(16, 18)
        for y in range(18):
            w = 2 + (y * 6) // 18
            c.rect(8 - w, y, 2 * w, 1, '#c0202a' if y < 12 else '#ff4a3a')
        c.rect(6, 2, 4, 6, '#ff9a6a')
        c.outline('#150b22')
        return {'shockwave': c.a}
    if kind == 'hook':
        c = Canvas(12, 16)
        c.rect(5, 0, 2, 9, '#cfcdcd')
        c.rect(2, 9, 2, 4, '#cfcdcd')
        c.rect(2, 12, 8, 2, '#cfcdcd')
        c.rect(8, 9, 2, 4, '#cfcdcd')
        c.px(2, 8, '#fdfefd')
        c.outline('#150b22')
        b = Canvas(10, 12)  # the float on the line
        b.rect(2, 1, 6, 5, '#c0202a')
        b.rect(2, 6, 6, 5, '#fdfefd')
        b.outline('#150b22')
        return {'hook': c.a, 'bobber': b.a}
    if kind == 'soundwave':
        c = Canvas(12, 18)
        for i, x in enumerate((2, 5, 8)):
            hgt = (6, 12, 16)[i]
            c.rect(x, 9 - hgt // 2, 2, hgt, '#ff9a6a' if i == 1 else '#d02a2a')
        c.outline('#150b22')
        return {'soundwave': c.a}
    if kind == 'roadster':
        return {'roadster': roadster(False), 'roadster-lights': lights_tower()}
    raise ValueError(kind)


def roadster(_):
    """Carl's red '32 Ford roadster in side view (photo 06), facing right: the boss drives it."""
    from pixelkit import Canvas
    c = Canvas(92, 40)
    red = ['#7a1010', '#c0202a', '#f04a3a', '#ff9a8a']
    # Body: long hood, open cockpit at the back, rear deck.
    c.rect(4, 18, 70, 12, red[1])
    c.rect(56, 14, 26, 12, red[1])  # bonnet over the engine
    c.rect(4, 14, 22, 6, red[1])    # rear deck
    c.rect(4, 14, 70, 2, red[2])
    c.rect(56, 14, 26, 2, red[2])
    c.rect(4, 27, 78, 3, red[0])
    c.rect(82, 16, 4, 12, '#868591')  # grille shell
    c.rect(83, 17, 2, 10, '#4a4954')
    # Chrome blower sticking out of the bonnet.
    c.rect(62, 8, 14, 6, '#cfcdcd')
    c.rect(62, 8, 14, 2, '#fdfefd')
    c.rect(64, 4, 4, 4, '#868591')
    c.rect(70, 4, 4, 4, '#868591')
    # Windscreen frame.
    c.rect(46, 6, 2, 10, '#cfcdcd')
    c.rect(46, 6, 6, 2, '#cfcdcd')
    # Wheels: big at the back, smaller in front.
    for cx, r in ((18, 10), (74, 8)):
        m = c.ellipse_mask(cx, 30, r, r)
        c.fill(m, '#150b22')
        c.fill(c.ellipse_mask(cx, 30, r - 3, r - 3), '#868591')
        c.fill(c.ellipse_mask(cx, 30, r - 5, r - 5), '#cfcdcd')
    c.outline('#150b22')
    return c.a


def lights_tower():
    """The drag strip's starting lights that count the start in (photo 03)."""
    from pixelkit import Canvas
    c = Canvas(14, 44)
    c.rect(6, 20, 2, 24, '#4a4954')
    c.rect(1, 0, 12, 22, '#c0202a')
    for i, col in enumerate(['#f5c35c', '#f5c35c', '#f5c35c', '#3cae4a']):
        c.rect(4, 2 + i * 5, 6, 4, col)
    c.outline('#150b22')
    return c.a


def bonus_portrait(spec, idle):
    """288x224 picture for the VIP room: the boss's bust, 4x, on his world's colours."""
    bg = [hx(c) for c in spec['boss']['bg']]
    out = np.zeros((224, 288, 4), np.uint8)
    for y in range(224):
        t = y / 223
        c = bg[0] if t < 0.45 else bg[1] if t < 0.8 else bg[2]
        # Dithered bands between the colours.
        out[y, :, :3] = c
        out[y, :, 3] = 255
    for y in range(224):
        for x in range(288):
            t = y / 223
            if abs(t - 0.45) < 0.03 and (x + y) % 2:
                out[y, x, :3] = bg[1]
            if abs(t - 0.8) < 0.03 and (x + y) % 2:
                out[y, x, :3] = bg[2]
    a = idle
    h = min(a.shape[0], 48)
    bust = a[:h]
    big = np.kron(bust, np.ones((4, 4, 1), np.uint8))
    bh, bw = big.shape[:2]
    x = (288 - bw) // 2
    y = 224 - bh
    region = out[y:y + bh, x:x + bw]
    m = big[..., 3] > 0
    region[m] = big[m]
    return out


def build(dj_id):
    spec = DJS[dj_id]
    base = os.path.join(ART, dj_id)
    for folder, src in (('hero', 'hero-bare'), ('hero-big', 'hero-big-bare')):
        for pose in ('idle', 'run', 'jump', 'sit'):
            fr = Frame(load(os.path.join(ART, src, f'{pose}.png')))
            paint_dj(fr, spec)
            save(fr.a, os.path.join(base, 'playable', folder, f'{pose}.png'))
    factor = spec['boss'].get('wide', 1.5)
    idle, fr = boss_pose(spec, 'idle', factor)
    attack, _ = boss_pose(spec, 'jump', factor)
    defeat, _ = boss_pose(spec, 'sit', factor)
    save(idle, os.path.join(base, 'idle.png'))
    save(attack, os.path.join(base, 'attack.png'))
    save(defeat, os.path.join(base, 'defeat.png'))
    save(idle, os.path.join(base, 'photo-pose.png'))
    small = Frame(load(os.path.join(ART, 'hero-bare', 'idle.png')))
    paint_dj(small, spec)
    save(portrait(small.a, small), os.path.join(base, 'portrait.png'))
    for kind in spec['boss']['props']:
        for name, a in prop(kind).items():
            save(a, os.path.join(base, f'{name}.png'))
    save(bonus_portrait(spec, idle), os.path.join(ART, 'bonus', f'portrait-{dj_id}.png'))
    preview(dj_id)


def preview(dj_id):
    base = os.path.join(ART, dj_id)
    files = [os.path.join(ART, 'hero-bare', 'idle.png')]
    files += [os.path.join(base, 'playable', 'hero', f'{p}.png') for p in ('idle', 'run', 'jump', 'sit')]
    files += [os.path.join(base, 'playable', 'hero-big', 'idle.png')]
    files += [os.path.join(base, f'{p}.png') for p in ('idle', 'attack', 'defeat', 'portrait')]
    ims = [Image.open(f).convert('RGBA') for f in files]
    W = sum(i.width for i in ims) + 8 * (len(ims) + 1)
    H = max(i.height for i in ims) + 16
    sheet = Image.new('RGBA', (W, H), (60, 52, 84, 255))
    x = 8
    for i in ims:
        sheet.alpha_composite(i, (x, H - 8 - i.height))
        x += i.width + 8
    sheet = sheet.resize((W * 4, H * 4), Image.NEAREST)
    os.makedirs(os.path.join(PREVIEWS, dj_id), exist_ok=True)
    sheet.save(os.path.join(PREVIEWS, dj_id, 'preview.png'))


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    for dj in sys.argv[1:] or DJS:
        build(dj)
        print('drew', dj)
