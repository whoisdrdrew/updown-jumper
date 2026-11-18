"""Build a world's four backdrop layers from Higgsfield pictures.
python3 tools/hf_world.py <dir with sky.png far.png mid.png near.png> <art id> [layer=scale,bottom,x ...]

Each picture is shrunk to the 640x360 layer size (two picture pixels per screen pixel, like the
other worlds). sky is opaque and does not scroll. far, mid and near keep their transparency; an
optional placement moves the drawn part: scale (1 = as drawn), bottom (where its lowest pixel
sits, as a share of the height: 0.5 = halfway down) and x (where its centre sits, as a share of
the width). dim=<layer>:<factor> darkens a layer (0.75 = 75% bright) so the players stand
out against it. repeat=<layer>:<n> places a
placed part n times evenly across the width (x is then ignored). seam=<layer>:mirror keeps the left half of a layer and adds it mirrored, for a band that
runs the whole width but doesn't tile by itself. seam=<layer>:edge keeps the middle as drawn and only
replaces the right 30% with the left 30% mirrored, softly joined (for a band with one feature in the middle). The layers tile sideways, so nothing should touch the left or right edge unless it
runs the whole width (a crowd). Everything below about y=265 is behind the ground tiles."""
import sys, os
from PIL import Image

W, H = 640, 360
SRC, ART = sys.argv[1], sys.argv[2]
place, dim, seam, rep = {}, {}, {}, {}
for arg in sys.argv[3:]:
    name, vals = arg.split('=')
    if name == 'dim':
        layer_name, f = vals.split(':')
        dim[layer_name] = float(f)
    elif name == 'repeat':
        layer_name, n = vals.split(':')
        rep[layer_name] = int(n)
    elif name == 'seam':
        layer_name, kind = (vals.split(':') + ['mirror'])[:2]
        seam[layer_name] = kind
    else:
        place[name] = [float(v) for v in vals.split(',')]

out = os.path.join(os.path.dirname(__file__), '..', 'src', 'art', 'world', ART)
os.makedirs(out, exist_ok=True)

for i, name in enumerate(['sky', 'far', 'mid', 'near']):
    im = Image.open(os.path.join(SRC, f'{name}.png')).convert('RGBA')
    k = W / im.width
    im = im.resize((W, round(im.height * k)), Image.BOX)
    if seam.get(name) == 'edge':
        # the right 30% becomes the left 30% mirrored, so the tiles join exactly; a soft 32 px join inside
        e = round(W * 0.3)
        flip = im.crop((0, 0, e, im.height)).transpose(Image.FLIP_LEFT_RIGHT)
        right = im.crop((W - e, 0, W, im.height))
        mask = Image.new('L', (e, im.height))
        for x in range(e):
            mask.paste(min(255, round(255 * x / 32)), (x, 0, x + 1, im.height))
        im.paste(Image.composite(flip, right, mask), (W - e, 0))
    elif name in seam:
        # keep the first half and add it again mirrored: both joins then match exactly
        half = im.crop((0, 0, W // 2, im.height))
        im = Image.new('RGBA', (W, im.height))
        im.paste(half, (0, 0))
        im.paste(half.transpose(Image.FLIP_LEFT_RIGHT), (W // 2, 0))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if name == 'sky':
        layer.paste(im.crop((0, 0, W, min(H, im.height))), (0, 0))
        # the picture may be a little short: repeat its last row
        for y in range(im.height, H):
            layer.paste(im.crop((0, im.height - 1, W, im.height)), (0, y))
        layer.putalpha(255)
    else:
        # hard edges: pixel art has no half-transparent pixels
        a = im.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
        im.putalpha(a)
        if name in place:
            s, bottom, cx = place[name]
            box = a.getbbox()
            part = im.crop(box)
            part = part.resize((max(1, round(part.width * s)), max(1, round(part.height * s))), Image.BOX)
            pa = part.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
            part.putalpha(pa)
            n = rep.get(name, 1)
            for k in range(n):
                x = cx * W if n == 1 else (k + 0.5) * W / n
                layer.alpha_composite(part, (round(x - part.width / 2), round(bottom * H - part.height)))
        else:
            layer.alpha_composite(im.crop((0, 0, W, min(H, im.height))), (0, 0))
    if name in dim:
        r, g, b, a = layer.split()
        r, g, b = (c.point(lambda v: round(v * dim[name])) for c in (r, g, b))
        layer = Image.merge('RGBA', (r, g, b, a))
    layer.save(os.path.join(out, f'{i}-{name}.png'), optimize=True)
    print(f'{i}-{name}.png', layer.size)
