// Checks every level against the difficulty curve (src/levels/difficulty.js), the world /
// gameplay split, and that every jump can be made (src/levels/reach.js plays them all with the
// game's own physics). Run: npm run check-levels. Exits with 1 if anything is wrong.
// It takes about half a minute: the reach check tries every jump from every spot.
import { LEVELS } from '../src/levels/index.js';
import { WORLDS } from '../src/levels/worlds/index.js';
import { BOSS_IDS } from '../src/bosses/ids.js';
import { measure, problems, targets } from '../src/levels/difficulty.js';
import { reach } from '../src/levels/reach.js';

let bad = 0;
const fail = (msg) => {
  bad += 1;
  console.log(`  x ${msg}`);
};
const r = (v) => Math.round(v * 10) / 10;

console.log('level  tiles  enemies/100  pits/100  widest  ducks/100  clock  boss       score');
LEVELS.forEach((gp, i) => {
  const n = i + 1;
  const m = measure(gp);
  console.log(
    `${String(n).padStart(5)}  ${String(m.length).padStart(5)}  ${String(r(m.danger)).padStart(11)}  ${String(r(m.pits)).padStart(8)}` +
      `  ${String(m.widestPit).padStart(6)}  ${String(r(m.ducks)).padStart(9)}  ${String(m.time).padStart(5)}` +
      `  ${`${m.bossHits}x ${m.bossSpeed}`.padEnd(9)}  ${r(m.score)}`,
  );
  if (gp.level !== n) fail(`file says level ${gp.level} but it is number ${n} in LEVELS`);
  const world = WORLDS[gp.world];
  if (!world) fail(`world '${gp.world}' is not in src/levels/worlds/index.js`);
  if (!BOSS_IDS.includes(gp.boss?.id)) fail(`boss '${gp.boss?.id}' is not in src/bosses/ids.js`);
  const widths = new Set(gp.rows.map((row) => row.length));
  if (widths.size > 1) fail('rows are not all the same length');
  const text = gp.rows.join('');
  for (const ch of ['P', 'F', 'K', 'S']) {
    const count = text.split(ch).length - 1;
    if (count !== 1) fail(`needs exactly one '${ch}', has ${count}`);
  }
  for (const p of problems(n, gp, LEVELS[i - 1])) fail(p);
  for (const p of reachProblems(gp)) fail(p);
});

// Sentences for everything the player can't get to. Columns and rows count from 0, like the rows.
function reachProblems(gp) {
  const r = reach(gp);
  if (r.error) return [r.error];
  const out = [];
  if (!r.flag) out.push("the flag can't be reached");
  if (!r.boss) out.push("the boss arena can't be reached");
  if (!r.suitcase) out.push("the suitcase can't be reached");
  if (!r.vip) out.push("the VIP door can't be reached");
  for (const t of r.tops) {
    out.push(`row ${t.y}, columns ${t.x}-${t.x2} ('${t.c}'): can't be stood on without a run-up (or at all)`);
  }
  for (const b of r.blocks) out.push(`row ${b.y}, column ${b.x} ('${b.c}'): this block can't be bumped from below`);
  for (const d of r.ducks) out.push(`row ${d.y}, column ${d.x}: this rubber duck can't be collected`);
  return out;
}

// Worlds are looks only: no level rows, enemies or boss tuning in them.
for (const [id, world] of Object.entries(WORLDS)) {
  for (const key of ['rows', 'time', 'boss', 'level']) {
    if (key in world) fail(`world '${id}' has '${key}': that belongs in a gameplay file`);
  }
}

const next = LEVELS.length + 1;
const t = targets(next);
console.log(`\nNext level (${next}) needs: ${t.minLength}+ tiles, enemy weight ${t.minDanger}+ per 100 tiles, ` +
  `${t.minPits}+ pits per 100 tiles, widest pit ${t.minWidestPit}-${t.maxWidestPit}, ` +
  `at most ${r(t.maxDucks)} ducks per 100 tiles, clock at most ${t.maxTime}s, boss ${t.minBossHits}+ hits at speed ${r(t.minBossSpeed * 100) / 100}+.`);
console.log(bad ? `\n${bad} problem(s).` : '\nAll levels fit the curve.');
process.exit(bad ? 1 : 0);
