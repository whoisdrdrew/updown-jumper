# Up-Down-Jumper

An 8-bit, Super Mario World style browser platformer starring Boris Brejcha's Up-Down-Jumper.
Built with [Phaser 3](https://phaser.io) and [Vite](https://vitejs.dev).

Current state: **Milestone 1, core movement**, with a first style pass after the Ibiza club reference. All art is placeholder pixel art drawn in code (`src/art/`), one test level.

## Play

- Online: https://whoisdrdrew.github.io/updown-jumper/ (after GitHub Pages is switched on, see below)
- Locally: install [Node.js](https://nodejs.org) 20 or newer, then

  ```
  npm install
  npm run dev
  ```

  and open the address it prints (usually http://localhost:5173).

Controls: left/right arrows to move, up arrow to jump (hold for a higher jump), Space to shoot a rubber duck (hold it to run, like the Y button in Super Mario World), R to restart.

On a phone or tablet the game fills the screen and NES-style controls float, half see-through, over the brick floor: left and right keys on the left and B (shoot, hold to run) and A (jump) on the right. Computers never show them. Phones play sideways only; held upright, the game pauses and asks you to turn the phone.

Test level items:

- **The mask**: every level starts without it. Jump on the suitcase in front of you: it opens, the mask goes on, and it stays on until you lose the life.
- **Solomun (end boss)**: waits in a one-screen arena before the flag. He floats cross-legged on a cloud of sauna steam, waves his towel, then dives and glides low over the floor. Jump on his head or hit him with a rubber duck: three hits and he's beaten (Mario 3 rules: after each hit he spins away for a moment and gets a little faster). Touching him any other way costs you a heart. The flag opens once he's gone.
- **Rubber ducks** float around the level like coins. Each one you collect is one shot; the counter is under the hearts.
- **Mangos** lie on the floor. Step on one and you slip and blink (one heart gone); a second slip loses the life. Shoot them away with rubber ducks or jump over them.
- **Blocks**: hit them from below. Brown bricks break. Music-note blocks (our "?" blocks) give a rubber duck or the duck egg, then turn into empty blocks.
- **Duck egg**: comes out of a music-note block and hatches by itself (or touch or shoot it) into a big duck. Jump on to ride it (it jumps a bit higher). If you get hit while riding, the duck runs off instead of you losing a heart; catch it again if you're quick.

## Project layout

| Path | What it is |
|---|---|
| `src/config.js` | Every movement number (speeds, jump height, gravity). Tune the game feel here. |
| `src/player/Player.js` | Player movement: acceleration, skidding, variable jump, coyote time, jump buffer. |
| `src/player/Controls.js` | Keyboard mapping. |
| `src/player/RubberDucks.js` | The rubber ducks you shoot. |
| `src/objects/Mangos.js` | Mangos: the slip hazard. |
| `src/objects/Blocks.js` | Breakable bricks and music-note item blocks. |
| `src/objects/RideDucks.js` | Duck egg and the ride-on big duck. |
| `src/touch/TouchControls.js` | On-screen controls for phones. |
| `src/objects/Boss.js` | Solomun, the world 1 end boss. |
| `src/objects/Suitcase.js` | The suitcase with the mask at the start of a level. |
| `src/levels/testLevel.js` | The test level, drawn as text (one character per tile). |
| `src/art/` | Art. The hero, the little duck and the suitcase are cleaned from Sandro's art; the ride duck, tiles, items and backgrounds in `src/art/world/` are drawn by `tools/world_art.py` at the same pixel size (run `python3 tools/world_art.py` to redraw them). |
| `src/scenes/GameScene.js` | Builds the level, camera, goal flag, pits and restarts. |

## Publishing

Every push to `main` builds the game and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The built game is plain static files in `dist/`,
so it can also be uploaded to any web host or embedded in a website with an `<iframe>`.
