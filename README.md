# Up-Down-Jumper

An 8-bit, Super Mario World style browser platformer starring Boris Brejcha's Up-Down-Jumper.
Built with [Phaser 3](https://phaser.io) and [Vite](https://vitejs.dev).

Current state: **Milestone 1, core movement.** Gray-box graphics, one test level.

## Play

- Online: https://whoisdrdrew.github.io/updown-jumper/ (after GitHub Pages is switched on, see below)
- Locally: install [Node.js](https://nodejs.org) 20 or newer, then

  ```
  npm install
  npm run dev
  ```

  and open the address it prints (usually http://localhost:5173).

Controls: left/right arrows to move, up arrow to jump (hold for a higher jump), Space to shoot rubber ducks (hold it to run, like the Y button in Super Mario World), R to restart.

Test level items:

- **Mangos** lie on the floor. Step on one and you slip and blink (one heart gone); a second slip loses the life. Shoot them away with rubber ducks or jump over them.
- **Duck egg**: touch it or shoot it and a big duck hatches. Jump on to ride it (it jumps a bit higher). If you get hit while riding, the duck runs off instead of you losing a heart; catch it again if you're quick.

## Project layout

| Path | What it is |
|---|---|
| `src/config.js` | Every movement number (speeds, jump height, gravity). Tune the game feel here. |
| `src/player/Player.js` | Player movement: acceleration, skidding, variable jump, coyote time, jump buffer. |
| `src/player/Controls.js` | Keyboard mapping. |
| `src/player/RubberDucks.js` | The rubber ducks you shoot. |
| `src/objects/Mangos.js` | Mangos: the slip hazard. |
| `src/objects/RideDucks.js` | Duck egg and the ride-on big duck. |
| `src/levels/testLevel.js` | The test level, drawn as text (one character per tile). |
| `src/scenes/GameScene.js` | Builds the level, camera, goal flag, pits and restarts. |

## Publishing

Every push to `main` builds the game and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The built game is plain static files in `dist/`,
so it can also be uploaded to any web host or embedded in a website with an `<iframe>`.
