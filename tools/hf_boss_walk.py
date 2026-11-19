"""Build an end boss's walking picture (src/art/<id>/walk.png) from his Higgsfield run concept.
python3 tools/hf_boss_walk.py <concept dir with idle.png and run.png> <repo> <id> [height]
The boss alternates it with his idle picture while he paces the arena, like Boris's two-step run.
The run is scaled so the head is as big as in his boss idle picture, and its colours are snapped to
the boss pictures' colours, so the two frames swap without the boss growing or changing colour. Long hair fools the head
measure (Steve Aoki, Charlotte de Witte): then give the walking picture's height by hand."""
import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from hf_clean import load, cells, tidy, crop, save, main_shape, snap

SRC, REPO, ID = sys.argv[1:4]
art = f'{REPO}/src/art/{ID}'
L = {p: load(f'{SRC}/{p}.png') for p in ('idle', 'run')}
idle_h = L['idle'][3][1] - L['idle'][3][0]

def head_w(p):
    """Width of the head in concept pixels: the widest row in the top 22% of the character."""
    a, fg, bg, box = L[p]
    rows = fg[box[0]:box[0] + int(idle_h * 0.22), box[2]:box[3]]
    return max((np.ptp(np.where(r)[0]) + 1) if r.any() else 0 for r in rows)

idle_pic = np.array(Image.open(f'{art}/idle.png').convert('RGBA')).astype(int)
target = int(np.ptp(np.where(idle_pic[..., 3] > 0)[0]) + 1)  # the boss idle's height in game pixels
step = idle_h / target * head_w('run') / head_w('idle')
a, fg, bg, box = L['run']
height = int(sys.argv[4]) if len(sys.argv) > 4 else int(round((box[1] - box[0]) / step))
run = cells(a, fg, box, height)
# The boss pictures' own colours.
px = np.concatenate([np.array(Image.open(f'{art}/{f}.png').convert('RGBA')).reshape(-1, 4) for f in ('idle', 'attack', 'defeat', 'photo-pose')])
pal = np.unique(px[px[:, 3] > 0][:, :3], axis=0).astype(int)
run = crop(main_shape(tidy(snap(run, pal))))

def head_x(r):
    top = r[: max(4, r.shape[0] // 4), :, 3] > 0
    xs = np.where(top.any(0))[0]
    return (xs.min() + xs.max()) / 2

# Head in the middle of the picture, like the other boss pictures, so the frames don't jump.
cx = head_x(run)
half = int(np.ceil(max(cx + 1, run.shape[1] - cx)))
out = np.zeros((run.shape[0], 2 * half, 4), int)
x = min(max(int(round(half - cx)), 0), 2 * half - run.shape[1])
out[:, x:x + run.shape[1]] = run
save(out, f'{art}/walk.png')
print(ID, 'walk', out.shape[1], 'x', out.shape[0], '(idle', idle_pic.shape[1], 'x', idle_pic.shape[0], ')')
