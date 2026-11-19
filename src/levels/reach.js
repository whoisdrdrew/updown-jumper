// Can the player actually get everywhere in a level? Plays every jump a player could make, using the
// game's own numbers (src/config.js PLAYER, PHYSICS) and the same tile collision rules as Phaser's
// arcade physics, and reports what nobody can reach: block tops to stand on, music-note blocks to
// bump, rubber ducks, the suitcase, the VIP door, the boss and the flag.
// Used by `npm run check-levels`. It walks on foot, small and without the ride-on duck: every DJ has
// Boris's moves, so if Boris on foot can reach it, every DJ can.
import { PHYSICS, PLAYER, TILE } from '../config.js';

const DT = 1 / 60; // Phaser arcade physics steps at 60 per second
const BIAS = 16; // Phaser's TILE_BIAS
const W = PLAYER.width;
const H = PLAYER.height;
const SOLID = new Set(['#', 'B', 'b', 'N', 'H', 'Y']);
const BUMP = new Set(['N', 'H', 'Y']);

// The level's tiles with Phaser's faces: a face is only solid where the neighbour doesn't collide;
// thin platforms '=' only stop you from above (and keep the top face of a solid tile under them).
function buildGrid(rows) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const ch = (x, y) => (y >= 0 && y < height && x >= 0 && x < width ? rows[y][x] || ' ' : ' ');
  const collides = (x, y) => SOLID.has(ch(x, y)) || ch(x, y) === '=';
  const tiles = [];
  for (let y = 0; y < height; y++) {
    tiles.push([]);
    for (let x = 0; x < width; x++) {
      const c = ch(x, y);
      if (!collides(x, y)) {
        tiles[y].push(null);
        continue;
      }
      const platform = c === '=';
      tiles[y].push({
        x, y, c,
        up: true, down: !platform, left: !platform, right: !platform, // collide flags
        faceTop: !collides(x, y - 1),
        faceBottom: !collides(x, y + 1),
        faceLeft: !collides(x - 1, y),
        faceRight: !collides(x + 1, y),
      });
    }
  }
  // GameScene: thin platforms block only from above, and keep the face of the tile below them.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = tiles[y][x];
      if (t?.c !== '=') continue;
      t.faceTop = true;
      t.faceBottom = t.faceLeft = t.faceRight = true;
      const below = tiles[y + 1]?.[x];
      if (below) below.faceTop = true;
    }
  }
  return { width, height, tiles, ch, pxW: width * TILE, pxH: height * TILE };
}

// One player body, moved and separated from tiles the way Phaser does it.
function step(g, b, events) {
  // Body.update: gravity, speed limit, move.
  b.prevX = b.x;
  b.prevY = b.y;
  b.up = b.down = false;
  b.vy += (PHYSICS.gravity + b.gravityExtra) * DT;
  if (b.vy > PLAYER.maxFallSpeed) b.vy = PLAYER.maxFallSpeed;
  if (b.vy < -PLAYER.maxFallSpeed) b.vy = -PLAYER.maxFallSpeed;
  b.x += b.vx * DT;
  b.y += b.vy * DT;
  // World bounds: left, right and top (the bottom is open, for the pits).
  if (b.x < 0) { b.x = 0; b.vx = 0; }
  if (b.x + W > g.pxW) { b.x = g.pxW - W; b.vx = 0; }
  if (b.y < 0) { b.y = 0; b.vy = 0; b.up = true; }

  // World.collideSpriteVsTilemapLayer: tiles around the body, row by row.
  const x0 = Math.floor((b.x - TILE) / TILE);
  const x1 = Math.floor((b.x + W + TILE - 1e-6) / TILE);
  const y0 = Math.floor((b.y - TILE) / TILE);
  const y1 = Math.floor((b.y + H + TILE - 1e-6) / TILE);
  for (let ty = Math.max(0, y0); ty <= Math.min(g.height - 1, y1); ty++) {
    for (let tx = Math.max(0, x0); tx <= Math.min(g.width - 1, x1); tx++) {
      const t = g.tiles[ty][tx];
      if (!t) continue;
      const l = tx * TILE, r = l + TILE, top = ty * TILE, bot = top + TILE;
      if (b.x + W <= l || b.y + H <= top || b.x >= r || b.y >= bot) continue;
      separate(b, t, l, r, top, bot, events);
    }
  }
}

function separate(b, t, l, r, top, bot, events) {
  const fh = t.faceLeft || t.faceRight;
  const fv = t.faceTop || t.faceBottom;
  if (!fh && !fv) return;
  const dx = b.x - b.prevX;
  const dy = b.y - b.prevY;
  let minX = 0;
  let minY = 1;
  if (Math.abs(dx) > Math.abs(dy)) minX = -1;
  else if (Math.abs(dx) < Math.abs(dy)) minY = -1;
  if (dx !== 0 && dy !== 0 && fh && fv) {
    minX = Math.min(Math.abs(b.x - r), Math.abs(b.x + W - l));
    minY = Math.min(Math.abs(b.y - bot), Math.abs(b.y + H - top));
  }
  const intersects = () => !(b.x + W <= l || b.y + H <= top || b.x >= r || b.y >= bot);
  if (minX < minY) {
    if (fh && checkX(b, t, l, r) && !intersects()) return;
    if (fv) checkY(b, t, top, bot, events);
  } else {
    if (fv && checkY(b, t, top, bot, events) && !intersects()) return;
    if (fh) checkX(b, t, l, r);
  }
}

function checkX(b, t, l, r) {
  const dx = b.x - b.prevX;
  let ox = 0;
  if (dx < 0 && t.right && t.faceRight && b.x < r) {
    ox = b.x - r;
    if (ox < -BIAS) ox = 0;
  } else if (dx > 0 && t.left && t.faceLeft && b.x + W > l) {
    ox = b.x + W - l;
    if (ox > BIAS) ox = 0;
  }
  if (ox) {
    b.x -= ox;
    b.vx = 0;
  }
  return ox;
}

function checkY(b, t, top, bot, events) {
  const dy = b.y - b.prevY;
  let oy = 0;
  if (dy < 0 && t.down && t.faceBottom && b.y < bot) {
    oy = b.y - bot;
    if (oy < -BIAS) oy = 0;
  } else if (dy > 0 && t.up && t.faceTop && b.y + H > top) {
    oy = b.y + H - top;
    if (oy > BIAS) oy = 0;
  }
  if (oy) {
    b.y -= oy;
    b.vy = 0;
    if (oy < 0) {
      b.up = true;
      if (events) events.bumps.push(t);
    } else b.down = true;
  }
  return oy;
}

const approach = (v, target, s) => (v < target ? Math.min(v + s, target) : Math.max(v - s, target));

// The moves tried from every spot the player can stand on: a run-up speed, how long jump is held
// (0 = walk off a ledge), and the steering in the air (first `a` for k frames, then `b`).
const SPEEDS = [0, 45, PLAYER.walkSpeed, 120, PLAYER.runSpeed];
const HOLDS = [0, 1, 8, 99];
const STEER = [];
for (const b of [-1, 0, 1]) STEER.push({ a: b, k: 0, b });
for (const k of [10, 22]) {
  for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, -1], [-1, 1]]) STEER.push({ a, k, b });
}

const SNAP = 6; // landing spots are rounded to this many pixels

// The two players the check plays with:
// RUN: holding run, with a jump 5% weaker than the real one, so no jump that's needed to finish
//   needs a pixel-perfect press. Must get from the start to the suitcase, VIP door, boss and flag,
//   and every rubber duck (ducks over pits may need a run-up).
// WALK: walking pace, never running. Starting from anywhere on the ground RUN got to (and every
//   landing RUN made by jumping over a pit), it must be able to stand on every block and platform
//   top and bump every music-note block. A run-up is only ever needed to cross pits, never to climb.
export const RUN = { runSpeed: PLAYER.runSpeed, jumpScale: 0.95 };
export const WALK = { runSpeed: PLAYER.walkSpeed, jumpScale: 1 };

// Plays the whole level from the player start. Returns what can't be reached.
// Plays the whole level from the player start. Returns what can't be reached.
export function reach(gameplay) {
  const { rows } = gameplay;
  const g = buildGrid(rows);
  let start = null;
  const ducks = [];
  const marks = {};
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'P') start = { x: x * TILE + TILE / 2, y: (y + 1) * TILE };
    if (c === 'o') ducks.push({ x, y, l: x * TILE + 4, r: x * TILE + 12, t: y * TILE + 4, b: y * TILE + 12 });
    if ('FKSV'.includes(c)) marks[c] = { x, y };
  }));
  if (!start) return { error: 'no player start' };
  ducks.at = new Map(ducks.map((d) => [d.y * 4096 + d.x, d]));

  // Drop the player onto the floor under the P.
  const body = { x: start.x - W / 2, y: start.y - H, vx: 0, vy: 0, gravityExtra: 0 };
  for (let i = 0; i < 120 && !body.down; i++) step(g, body);
  if (!body.down) return { error: 'the player start has no floor under it' };

  const flagX = marks.F ? marks.F.x * TILE + TILE / 2 : null;
  const run = explore(g, [{ x: body.x, y: body.y }], RUN, ducks, flagX);
  const groundY = (g.height - 3) * TILE - H; // feet on the top row of ground
  const walk = explore(g, [...run.nodes.filter((n) => n.y === groundY), ...run.pitLandings], WALK, ducks, flagX);

  const stoodOn = new Set();
  for (const n of walk.nodes) {
    const ty = Math.round((n.y + H) / TILE);
    for (let tx = Math.floor(n.x / TILE); tx <= Math.floor((n.x + W - 1e-6) / TILE); tx++) stoodOn.add(`${tx},${ty}`);
  }
  const tops = [];
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const t = g.tiles[y][x];
      if (!t || !t.faceTop || t.c === '#') continue;
      if (y * TILE < H || g.tiles[y - 1]?.[x] || g.tiles[y - 2]?.[x]) continue; // no room to stand
      if (!stoodOn.has(`${x},${y}`)) tops.push({ x, y, c: t.c });
    }
  }
  const nearMark = (m) => !m || run.nodes.some((n) => Math.abs(n.x + W / 2 - (m.x * TILE + TILE / 2)) <= TILE);
  const blocks = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (BUMP.has(c) && !walk.bumped.has(`${x},${y}`)) blocks.push({ x, y, c });
  }));
  return {
    flag: run.flag,
    boss: nearMark(marks.K),
    suitcase: nearMark(marks.S),
    vip: nearMark(marks.V),
    tops: runs(tops),
    ducks: ducks.filter((d) => !run.ducks.has(d) && !walk.ducks.has(d)).map((d) => ({ x: d.x, y: d.y })),
    blocks,
  };
}

// Every spot one kind of player can get to from the seeds, and what it touches on the way.
function explore(g, seeds, moves, ducks, flagX) {
  const seen = new Map(); // node key -> { x, y }
  const queue = [];
  const visit = (x, y) => {
    const node = { x: Math.round(x / SNAP) * SNAP, y: Math.round(y) };
    const k = `${node.x},${node.y}`;
    if (seen.has(k)) return;
    seen.set(k, node);
    queue.push(node);
  };
  seeds.forEach((s) => visit(s.x, s.y));
  const gotDuck = new Set();
  const bumped = new Set();
  const pitLandings = [];
  let flag = false;

  // How far the player can run on this floor behind x before it ends or a wall is in the way.
  const roomBehind = (x, y, dir) => {
    let room = 0;
    for (let d = 2; d <= 40; d += 2) {
      const nx = x - dir * d;
      if (nx < 0 || nx + W > g.pxW) break;
      if (!standsAt(g, nx, y)) break;
      room = d;
    }
    return room;
  };

  while (queue.length) {
    const node = queue.shift();
    for (const dir of [-1, 1]) {
      const room = roomBehind(node.x, node.y, dir);
      // Walking off a ledge is only tried close to one.
      const edgeAhead = !standsAt(g, node.x + dir * 12, node.y);
      for (const speed of SPEEDS) {
        if (speed === 0 && dir === -1) continue;
        if (speed > moves.runSpeed) continue;
        // Speeding up from a stand to `speed` on the ground takes speed^2 / (2 * groundAccel) pixels.
        if ((speed * speed) / (2 * PLAYER.groundAccel) > room + 0.01) continue;
        for (const hold of HOLDS) {
          if (hold === 0 && (speed === 0 || !edgeAhead)) continue;
          for (const steer of STEER) {
            if (hold === 0 && steer.k > 0) continue; // walking off a ledge: one steer for the fall
            const res = jump(g, node, dir * speed, hold, steer, ducks, flagX, moves);
            if (!res) continue;
            res.ducks.forEach((d) => gotDuck.add(d));
            res.bumps.forEach((t) => bumped.add(`${t.x},${t.y}`));
            if (res.flag) flag = true;
            if (res.overPit) pitLandings.push({ x: res.x, y: res.y });
            visit(res.x, res.y);
          }
        }
      }
    }
    if (flagX !== null && Math.abs(node.x + W / 2 - flagX) < TILE) flag = true;
  }
  return { nodes: [...seen.values()], ducks: gotDuck, bumped, flag, pitLandings };
}

// Is there floor under a standing body at x, with its feet at y + H?
function standsAt(g, x, y) {
  const ty = Math.round((y + H) / TILE);
  if (Math.abs(ty * TILE - (y + H)) > 0.5) return false;
  let floor = false;
  for (let tx = Math.floor(x / TILE); tx <= Math.floor((x + W - 1e-6) / TILE); tx++) {
    if (g.tiles[ty]?.[tx]?.faceTop) floor = true;
    for (let r = Math.floor(y / TILE); r < ty; r++) if (g.tiles[r]?.[tx] && g.tiles[r][tx].c !== '=') return false;
  }
  return floor;
}

// One move from a standing spot. Returns where it lands (or null if it falls into a pit or never
// leaves the ground), and the ducks, note blocks and flag touched on the way.
function jump(g, node, vx0, hold, steer, ducks, flagX, moves) {
  const b = { x: node.x, y: node.y, vx: vx0, vy: 0, gravityExtra: 0, down: true, up: false, prevX: node.x, prevY: node.y };
  const events = { bumps: [] };
  const got = [];
  let flag = false;
  let airborne = 0;
  let overPit = false;
  const moveDir = Math.sign(vx0);
  for (let f = 0; f < 300; f++) {
    // Player.update: steer, jump, gravity.
    const onGround = b.down;
    const d = hold === 0 && airborne === 0 ? moveDir : f < steer.k ? steer.a : steer.b;
    if (d !== 0) {
      const turning = b.vx !== 0 && Math.sign(b.vx) !== d;
      const accel = !onGround ? PLAYER.airAccel : turning ? PLAYER.skidDecel : PLAYER.groundAccel;
      b.vx = approach(b.vx, d * moves.runSpeed, accel * DT);
    } else if (onGround) {
      b.vx = approach(b.vx, 0, PLAYER.groundDecel * DT);
    }
    if (f === 0 && hold > 0) b.vy = -(PLAYER.jumpSpeed + Math.abs(b.vx) * PLAYER.runJumpBonus) * moves.jumpScale;
    const held = hold > 0 && f < hold;
    b.gravityExtra = b.vy < 0 && held ? 0 : PLAYER.releaseGravity - PHYSICS.gravity;

    step(g, b, events);

    for (let ty = Math.floor(b.y / TILE); ty <= Math.floor((b.y + H) / TILE); ty++) {
      for (let tx = Math.floor(b.x / TILE); tx <= Math.floor((b.x + W) / TILE); tx++) {
        const duck = ducks.at.get(ty * 4096 + tx);
        if (duck && b.x < duck.r && b.x + W > duck.l && b.y < duck.b && b.y + H > duck.t) got.push(duck);
      }
    }
    if (flagX !== null && b.x < flagX + 3 && b.x + W > flagX - 3) flag = true;
    if (b.y > g.pxH + TILE) return null; // fell into a pit
    if (!g.tiles[g.height - 1][Math.floor((b.x + W / 2) / TILE)]) overPit = true;
    if (!b.down) airborne += 1;
    else if (airborne > 0) return { x: b.x, y: b.y, ducks: got, bumps: events.bumps, flag, overPit };
    else if (hold === 0 && f > 30) return null; // walked along without leaving the floor
  }
  return null;
}

// Groups single tiles into runs along a row, for short messages.
function runs(tiles) {
  const out = [];
  for (const t of tiles) {
    const last = out[out.length - 1];
    if (last && last.y === t.y && last.x2 === t.x - 1) last.x2 = t.x;
    else out.push({ y: t.y, x: t.x, x2: t.x, c: t.c });
  }
  return out;
}
