# Batch: building the DJ levels

This is the playbook for one run that turns Sandro's inputs into finished levels, all of them, with
no approvals in between. Sandro reviews and reworks afterwards, level by level. Follow it top to
bottom. Never stop to ask: when something is missing or unclear, make the best call, write it down
in the level's review notes (step 8) and keep going.

## 0. What goes in, what comes out

**In** (project files, `/mnt/project-files/levels-input/`, layout in its `README.md`):

- `dj-list.md`: the DJs in level order. Line 1 is Solomun (done); the next line is level 2.
- `<dj-folder>/character/`: photos of the DJ.
- `<dj-folder>/world/`: pictures of the place the level plays in.
- `<dj-folder>/notes.md`: look, world, boss idea, songs (any of it may be empty).

**Out**, for every DJ after Solomun, level number `n`, id `<id>` (his folder name):

| Part | Files | Separate design? |
|---|---|---|
| Playable DJ | `src/art/<id>/playable/hero/` and `hero-big/` | Same poses, sizes and moves as Boris; only the look differs |
| End boss | `src/art/<id>/` + `src/bosses/<id>.js` | Yes: his own bigger design and attack, not the playable sprite |
| World | `tools/world_<id>.py` → `src/art/world/<id>/`, builder in `src/art/background.js`, `src/levels/worlds/<world>.js` | Looks only |
| Gameplay | `src/levels/gameplay/<nn>-<id>.js` | Play only; names its world |
| Wiring | roster, Line-Up, bonus portrait, Afterparty, bookings | |
| Review notes | `/mnt/project-files/levels-review/<nn>-<id>.md` + screenshots | |

## 1. Rules that always hold

- **World and gameplay are separate.** A world file (`src/levels/worlds/`) is the backdrop, palette,
  decor and the name on the top bar. A gameplay file (`src/levels/gameplay/`) is the tile rows,
  enemies, pits, items, boss tuning and clock. Gameplay names its world and may take ideas from the
  world's `motifs`; the world never refers to gameplay. **Any gameplay tuning touches only
  `src/levels/gameplay/` (and new enemy code), never a world file or world art.** Check with
  `git diff --stat` before each commit of a tuning change.
- **Every level is longer and harder than the one before.** The curve is `src/levels/difficulty.js`
  (level 1 is the baseline). `npm run check-levels` must pass after every level; it prints what the
  next level needs.
- **Playable DJ and boss are two designs** of the same person (rule from 2026-10-27).
- **The winner photo shows the DJ played plus the boss beaten**: the boss class needs a photo pose
  (`standForPhoto`). The player side is already the picked DJ.
- **The Afterparty grows past 10 spots** (a second floor or a rotating booth) once there are more
  than 10 DJs.
- **Art follows `/mnt/project-files/prompts/style-guide.md`** (pixel size, chibi proportions,
  `#150b22` outline, master palette, darker backgrounds). Prompts: `prompts/image-prompts.md`.
- Same commit style as the repo: one commit per DJ, message in plain words
  ("Level 3: <DJ>, <world> world"). One branch and one pull request for the whole batch, so Sandro can
  review commit by commit.

## 2. Once, before the first DJ

1. Read `dj-list.md` and every input folder. Make the list of levels: `n = 2, 3, ...` in list order.
   DJs past level 10 become New Bookings levels (`src/hub.js`), numbered 11 onward, same curve.
2. Make the per-level pieces that are still Solomun-only generic (small, behaviour-neutral changes,
   commit as "Prepare levels for more DJs"):
   - `src/art/bonus.js` / `BonusScene.js`: load `bonus-portrait-<id>` per level (the boss of the
     level) instead of the one `bonus-portrait`.
   - `src/objects/Boss.js` `standForPhoto` and `AfterpartyScene.js` preload: use the boss's own
     photo-pose texture (`<id>-photo-pose`) from the boss registry.
   - The VIP room MUSIC button and the Afterparty booth: play the level boss's beat
     (`BOSS_SONG` today) from the boss registry.
   - `src/art/home.js`: load `lineup-<id>` and `home-<id>` for every DJ in `src/djs.js`, and make
     `HomeScene.makeSilhouette` run for each of them.
   Re-run level 1 (step 7) after this and confirm it looks and plays exactly as before.

## 3. Per DJ: playable character

Goal: four poses, two sizes, the exact frames Boris uses, so the DJ moves exactly like him.

| Folder | Files | Frame size (px) |
|---|---|---|
| `src/art/<id>/playable/hero/` | `idle.png`, `run.png`, `jump.png` | 44 x 52 |
| | `sit.png` (riding the duck) | 31 x 50 |
| `src/art/<id>/playable/hero-big/` | `idle.png`, `run.png`, `jump.png` | 44 x 66 |
| | `sit.png` | 36 x 64 |

- Make them like Solomun's (`src/art/solomun/playable/`, notes in `art/` of the project files):
  generate in Higgsfield with the matching pose of Boris attached as reference
  (`art/clean/hero-reference.png` and Boris's pose PNGs) plus 1-2 of the DJ's photos, then clean with
  `art/clean/build.py` (true pixel grid, background off, palette snap, outline).
- Bottom-aligned and centred in the frame, feet on the same row as Boris's, head about half the
  height. Overlay on Boris's `idle.png`: crown, chin, shoulders and feet within 2 px.
- No mask: hero/ is used for both his masked and bare looks.
- They are picked up automatically (`DJ_SKINS` in `src/art/sprites.js`).
- Keep the raw generations and a `preview.png` (Boris next to the DJ, both sizes) in
  `/mnt/project-files/art/<id>/`.

## 4. Per DJ: end boss

- Poses in `src/art/<id>/`: an idle/fight pose, an attack pose, `defeat.png`, `photo-pose.png`
  (arm round the player, for Felix's photo), `portrait.png` (about 37 x 30, top bar and Line-Up), plus
  any props. Boss size: about 1.3x the hero's height, 1.5-2x his width (style guide section 2).
- Bonus room portrait: `src/art/bonus/portrait-<id>.png`, same size and frame as Solomun's.
- Code: `src/bosses/<id>.js`, a class with the same interface as `src/objects/Boss.js`
  (`constructor(scene, arena, tuning)`, `takeHit`, `hurtable`, `mode`, `standForPhoto`, events
  `hit` and `defeated`; `tuning.hits` and `tuning.speed` come from the gameplay file). Its own attack
  from `notes.md`; if there is none, invent one from the DJ's look or signature (Solomun: sauna
  steam and the towel dive). Keep it fair: a clear warning before every attack, a moment when he
  can be stomped or shot, faster after each hit. Its numbers live at the top of its own file.
- Register it in `src/bosses/ids.js` and `src/bosses/index.js` (name, portrait texture, create).
- A boss beat for the VIP room and Afterparty: a new song object like `BOSS_SONG` in its own file
  in `src/audio/`, other key and tempo, or his MP3 if `notes.md` gives one we may use.

## 5. Per DJ: world

- Pick the world from `world/` pictures and `notes.md`. Nothing there: use the DJ's best-known venue
  or set, and say so in the review notes.
- Draw it with a `tools/world_<id>.py` like `tools/world_solomun.py` (pixelkit, 640 x 360 layers
  at the hero's pixel size, seamless sideways, darker and lower contrast than the sprites, background
  people in the chibi build holding still). 2 to 4 layers back to front, each with its own scroll speed.
- Add its preload and a builder to `src/art/background.js` (like `tulumLayers`), keyed by the
  world's `background`.
- Write `src/levels/worlds/<world>.js` like `tulum.js`: `id`, `name` (one word, caps, top bar),
  `dj`, `background`, `tiles`, `pit`, `palette`, `layers`, `motifs` (ideas for the gameplay). No
  `rows`, `time`, `boss` or `level` (the check fails if a world has them). Add it to
  `src/levels/worlds/index.js`.
- Tiles stay the shared tileset unless the world clearly needs its own; then add a tileset image
  and use the world's `tiles` key.

## 6. Per DJ: gameplay

Write `src/levels/gameplay/<nn>-<id>.js` like `01-solomun.js`, add it to `LEVELS` in
`src/levels/index.js`, then run `npm run check-levels` until it passes.

- **Targets**: whatever `check-levels` printed as "Next level needs". Aim a bit above the minimum
  so the next level still has room to grow; go easy on the clock.
- **Rows**: 12 rows, all the same length. Bottom 3 are ground. Letters in `src/levels/legend.js`.
- **Shape of a level** (left to right):
  1. Start: `P`, the suitcase `S` 2 tiles right, a safe flat stretch of about 15 tiles.
  2. Teach: the world's idea in a safe form (e.g. low beams as thin platforms over solid ground).
  3. Build: the same idea with pits and enemies, getting harder towards the middle.
  4. VIP door `V` on a platform around the middle, with a short calm stretch around it.
  5. Peak: the hardest part, longest pits, heads of security.
  6. Rest: about 10 tiles with a few ducks before the arena.
  7. Arena: 20 tiles of flat solid ground (one screen) with `K` in the middle, 2 rows above the floor,
     nothing else in it. Flag `F` a few tiles after the arena, on solid ground.
- **Always reachable**: a standing jump rises about 2.5 tiles and a running jump about 3.5, so no
  platform more than 3 tiles above the one before it (2 if you can't take a run-up); pits no wider
  than the curve allows (5 max); a thin platform `=` or ground under every landing.
- **Use the world, don't change it**: build the platform shapes from the world's `motifs`.
- **Items**: exactly one `H` (burger) in levels 2-5, at most one later, early in the level.
  One `Y` (duck egg) from level 3 on, before a hard stretch. Ducks `o` mostly in arcs that show the
  jump, fewer per tile each level (the curve caps them).
- **Boss**: `boss: { id: '<id>', hits, speed }` at least the curve's numbers.
- **New enemies or hazards** are allowed when the world suggests them: add the letter to
  `legend.js` with a `danger` weight, code in `src/objects/`, parsing in `GameScene.buildLevel`.
  Keep them simple and readable at a glance.

## 7. Per DJ: wiring and checks

1. `src/djs.js`: add the DJ (`id`, `name`, `desk: 'home-<id>'`, `portrait: 'lineup-<id>'`, `songs`,
   `skin: '<id>-'`, `levels: [n]`, `unlocked: () => levelsDone() >= n`).
2. `src/art/afterparty.js` `DJS`: fill his spot in level order (`texture: '<id>-photo-pose'`, `beat`).
   Past 10 DJs: add the second floor or rotating booth spots in `DJ_SPOTS` and the room art.
3. Levels 11+: add him to `BOOKINGS` in `src/hub.js` with `dj` and `levels`.
4. Home: Boris World picks up built levels and boss names from `src/levels/` by itself.
5. `npm run check-levels` and `npm run build` pass.
6. Play-check in the browser (Playwright, see the repo's earlier checks): start the level with
   `__game.scene.start('game', { level: n })` after setting `localStorage['updown-jumper.seen-intro']
   = '1'`, no console errors; screenshots of the start, the middle, the arena with the boss, the
   winner photo, the bonus room portrait, the Line-Up and the Afterparty. Pick the DJ in the Line-Up
   (`localStorage['updown-jumper.dj'] = '<id>'`) and check he walks, runs, jumps and rides like Boris.
7. Level 1 still plays and looks as before.
8. Update the README's level list and project layout table for anything new.
9. Commit: "Level n: <DJ>, <WORLD> world".

## 8. Review notes for Sandro

For every level write `/mnt/project-files/levels-review/<nn>-<id>.md` and put the screenshots in
`/mnt/project-files/levels-review/<nn>-<id>/`:

- What was built: playable DJ, boss and his attack, world, gameplay in two lines each.
- The level's numbers from `check-levels`.
- **Guesses**: everything decided without an input (a missing world picture, an invented attack, a
  placeholder beat), so these are the first things to look at.
- What to try first when reworking: "world only" or "gameplay only" changes, and which files each is.

At the end, `/mnt/project-files/levels-review/README.md`: one row per level (DJ, world, length,
score, guesses count, link to notes), plus the PR link.

## Reworking later (after the batch)

- **Gameplay only** (too hard, too easy, a bad jump): edit `src/levels/gameplay/<nn>-<id>.js`, run
  `npm run check-levels`. If the curve now fails for a later level, raise that later level too, or
  lower this one; never change a world to fix gameplay.
- **World only** (colours, decor, mood): edit `tools/world_<id>.py` / the world file and redraw. No
  gameplay file changes, and `check-levels` numbers stay the same.
- **Curve** (all levels feel too steep): change `targets()` in `src/levels/difficulty.js`, then
  re-check every level.
