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

- As an app on your phone: open the online address on the phone, then
  - iPhone (Safari): Share button, **Add to Home Screen**, Add.
  - Android (Chrome): menu (three dots), **Add to Home screen** or **Install app**.

  It gets its own icon and opens full screen, sideways, with no browser bars. Once opened, it also starts without a connection (songs you have played are kept too). New builds show up the next time you open it online. Icons: `public/icons/`, drawn by `tools/app_icon.py`; app settings in `public/manifest.webmanifest`, offline copy in `public/sw.js`.

Controls: left/right arrows to move, up arrow to jump (hold for a higher jump), Space to shoot a rubber duck (hold it to run, like the Y button in Super Mario World), up arrow at the VIP door to go through it, R to restart.

On a phone or tablet the game fills the screen, and the controls are kept small and faint so they hide as little of it as possible (like Leo's Fortune). Put your left thumb down anywhere on the left 45% of the screen: a cross appears under it. Slide left or right to walk, slide further to run, slide up for the VIP door. If your thumb drifts, the cross follows it. On the right, B (shoot, hold to run) and A (jump) are small circles in the margin, but the whole bottom right of the screen is their touch area: a tap there presses whichever button is nearer, and you can slide from one to the other. Computers never show them. Phones play sideways only; held upright, the game pauses and asks you to turn the phone.

**Home screen**: the game opens in Boris's music studio (desk with the PC, big speakers, sound panels, headphones). The wall has four sections, two either side of the middle panel with the title and the round play button: **Boris World**, **New Bookings**, **Special Stages** and **Line-Up** (menu v3, art in `art/hub/v3/` of the project files). Left/right steps through the four sections and the play button; up, Space or Enter (or a tap) opens one in a window over the dimmed studio, and Esc, the X or a tap outside closes it. Corner tags say what's new (1 NEW, LIVE, 2/30). **Boris World** holds the 10 levels as instant photos: finished levels show their winner photo from Felix, the next level has a gold play arrow, the rest are locked; the strip under them names the level, its boss and who you play as. The Afterparty ticket and the 10 golden nuggets are on the right. **New Bookings** shows the DJs who join each month (left/right through the DJs and back through the months); beat them, then play them. **Special Stages** lists partner levels for a limited time with their prize and the days left. **Line-Up** is a grid of 30 DJ spots ("CHOOSE THE DJ YOU WANNA PLAY WITH"), scrolling past 3 rows; a DJ unlocks once his levels are won (Solomun after level 1). The DJ you pick stands at the desk, shows in the Line-Up section's picture, and his songs go to the top of the song menu. The bookings and partner stages are placeholders from the mockups (`src/hub.js`); the DJs are in `src/djs.js`. The picked DJ is the one you play in the levels and the VIP room: Solomun has his own walking pictures (`src/art/solomun/playable/`, the same poses and sizes as Boris's, so he moves exactly the same; he has no mask, so his masked and bare looks are the same picture). A new DJ's set dropped into `src/art/<dj>/playable/hero/` and `hero-big/` is picked up automatically. **Menu music**: the play button on the middle panel opens a song menu (up/down and Enter, or tap a song; Enter again stops it, Esc or a tap outside closes the menu): the picked DJ's songs first, then the other unlocked DJs', scrolling past 5. While a song plays the button shows pause bars. Boris's 5 songs are Boris Brejcha tracks from Sandro's playlist (Up Down Jumper, Level One, House Music, Gravity, Purple Noise), used with permission, compressed to 80 kbps MP3 in `public/music/` (list in `src/audio/songs.js`); Solomun's is his boss beat. Only level 1 is built so far; later levels say COMING SOON. Finishing a level saves it and its photo in the browser and brings you back to the studio, where Boris World opens and the new photo develops on its card. Losing a life restarts the level. The EXIT button in the top left of a level (or the bonus room), or Esc, goes back to the studio. Art in `src/art/home/`.

**Intro story**: the first time you play level 1, it starts in Boris's bedroom, like the start of a Mario game. He wakes up and wonders where Ginger is; walk him out of the door on the right. In the stable, walk up to LEGO the horse and the story plays: the dialog, the note from the Guestlist King, and Boris storming off into level 1. Press up, Space, Enter or tap/click to move the dialog on (a press while text is typing shows it all). The first time it can't be skipped; once you've reached level 1 a SKIP button shows in the top right (or press Esc). That is remembered in the browser. Press S at any time to start the story over.

Test level items:

- **The mask**: every level starts without it. Jump on the suitcase in front of you: it opens, the mask goes on, and it stays on until you lose the life.
- **Solomun (end boss)**: waits in a one-screen arena before the flag. He floats cross-legged, sitting in a cloud of sauna steam, waves his towel, then dives and glides low over the floor. Jump on his head or hit him with a rubber duck: three hits and he's beaten (Mario 3 rules: after each hit he spins away for a moment and gets a little faster). Touching him any other way costs you a heart. Beaten, he throws in the towel but stays: he comes down beside Boris, smiling, peace sign up and an arm round his shoulder. Then **Felix the Photographer** (blond hair, black tee with a neon yellow ring, huge mustache, flash camera) walks in, Boris hops for joy, and Felix takes the winner photo: a white flash, a click, and the instant photo of the two of you pops up and develops over the dimmed screen. After that the way to the flag is open.
- **Rubber ducks** float around the level like coins. Each one you collect is one shot; the counter is under the hearts.
- **Security bouncers** (they replaced the mangos): big bald bouncers in sunglasses, arms crossed, pacing back and forth like Goombas. Walk into one and he shoves you back (one heart gone; a second hit loses the life). Jump on his head or hit him with a rubber duck to knock him out. Art in `src/art/security/`.
- **VIP room party**: moving head lights sweep along the top of the room (brighter while the music button is on), two CO2 cannons at the far left and right of the big room blast every minute (the first time a few seconds after you come in) with a hiss, and the music button plays the boss beat. Art in `src/art/vip-fx/`, code in `src/objects/VipFx.js`.
- **Golden chicken nuggets**: catch every duck in a level's VIP room before the 15 seconds run out and you win that level's golden nugget. It pops up and shines, then flies into its slot under the duck counter. One per level, saved in the browser.
- **Afterparty**: the Boris World window shows the Afterparty ticket (after level 10 on left/right) with the 10 nugget slots under it. The ticket is grey with a padlock until all 10 nuggets are won (for now it opens the Afterparty anyway, so it can be seen: `AFTERPARTY_OPEN_EARLY` in HomeScene.js); with all 10 it turns gold. It opens the Afterparty, a room (not a level) where the DJs hang out. Left/right (or tap) picks a DJ, Enter/Space/up (or a second tap) sends him up the steps to the booth and his music plays; pick him again to stop. Boris can DJ too: pick him on the dance floor and he plays his 5 tracks (the menu songs) one after another, the track's name at the top. While a DJ plays, Boris dances (fist pump, arms up), on the floor or at the booth; the characters only dance here (the level crowd and the VIP room hold still). Two CO2 cannons either side of the stage go off every minute, like in the VIP room. Only Solomun exists of the other DJs so far; the other 9 spots say COMING SOON. Art in `src/art/afterparty/`, positions in `src/art/afterparty.js`.
- **Head of security**: the bouncers' boss, a bit taller than Boris, bearded, with a gold badge. He patrols like them, but when he sees Boris in front of him on his floor (within 8 tiles) he points and shouts (a "!" over his head), charges head down, and throws a punch when he's close: a hard knockback and a heart gone. If he misses he skids to a stop and goes back to patrolling. It takes two stomps (or two rubber ducks) to knock him out. Level 1 has two (letter `C` in the level text). Art in `src/art/head-of-security/`.
- **Blocks**: hit them from below. Brown bricks break. Music-note blocks (our "?" blocks) give a rubber duck or the duck egg, then turn into empty blocks.
- **Burger (power-up, like Mario's mushroom)**: some music-note blocks hold a red and yellow burger box. It hops out, slides off the blocks, lands and pops open, and the burger rises out. Eat it and Boris grows big; the next hit (a bouncer, Solomun) only shrinks him back instead of costing a heart. Level 1 has one burger block, near the start; the other music-note blocks hold rubber ducks.
- **VIP door and the duck bonus room** (like the coin rooms in Mario 3): the door stands on a platform in the middle of level 1. Stand in front of it and press up (the A button still jumps). Inside are two buttons, which work like Mario's switch blocks: jump on top of them (from the side they're just blocks). MUSIC starts or stops the boss's beat (a placeholder loop we made, not one of his tracks); TIMER asks if you want to start the clock (YES on the popup). The 15 second clock starts and the gold gate to the big room opens. Its floor is a trampoline that always bounces you up to the top row of ducks; behind the 63 ducks is a big portrait of the end boss, and every duck you grab uncovers a piece of it. When time is up the other ducks vanish and the whole portrait shows. Leave through the door (up again); the ducks you got are added to your shots. The challenge can be played once per try at the level.
- **Duck egg** (saved for later levels): comes out of a music-note block and hatches by itself (or touch or shoot it) into a big duck. Jump on to ride it (it jumps a bit higher). If you get hit while riding, the duck runs off instead of you losing a heart; catch it again if you're quick.

## Project layout

| Path | What it is |
|---|---|
| `src/config.js` | Every movement number (speeds, jump height, gravity). Tune the game feel here. |
| `src/player/Player.js` | Player movement: acceleration, skidding, variable jump, coyote time, jump buffer. |
| `src/player/Controls.js` | Keyboard and touch mapping. |
| `src/player/RubberDucks.js` | The rubber ducks you shoot. |
| `src/objects/Securities.js` | The security bouncers: pace, shove you back, stomp or shoot them. |
| `src/scenes/AfterpartyScene.js` | The Afterparty room: pick which DJ plays at the booth. |
| `src/objects/HeadSecurity.js` | The head of security: patrol, spot, charge, punch, skid; two stomps to knock out. |
| `src/objects/Blocks.js` | Breakable bricks and music-note item blocks. |
| `src/objects/Burgers.js` | The burger box and the burger power-up. |
| `src/objects/RideDucks.js` | Duck egg and the ride-on big duck. |
| `src/touch/TouchControls.js` | On-screen controls for phones. |
| `src/objects/Boss.js` | Solomun, the world 1 end boss. |
| `src/objects/WinnerPhoto.js` | Felix the Photographer and the winner photo after a boss fight. Art in `src/art/felix/` (by `tools/felix_art.py`). |
| `src/objects/Suitcase.js` | The suitcase with the mask at the start of a level. |
| `src/levels/testLevel.js` | The test level, drawn as text (one character per tile). |
| `src/art/` | Art. The hero, the little duck and the suitcase are cleaned from Sandro's art; the ride duck, tiles, items and backgrounds in `src/art/world/` are drawn by `tools/world_art.py` at the same pixel size (run `python3 tools/world_art.py` to redraw them). |
| `src/scenes/HomeScene.js` | The home screen in Boris's studio: the four sections and their windows (levels, bookings, special stages, Line-Up) and the song menu; finished levels, their photos and the picked DJ are saved by `src/progress.js`. |
| `src/scenes/IntroScene.js` | The intro story: bedroom and the horse stable, the dialog box, speech bubble, letter and skip button. Pictures in `src/art/intro/`. |
| `src/scenes/BonusScene.js` | The duck bonus room behind the VIP door: buttons, timer popup, trampoline and the portrait reveal. Art in `src/art/bonus/` (drawn by `tools/bonus_art.py`). |
| `src/audio/BossBeat.js` | The music button's beat, made with Web Audio (no sound files). |
| `src/progress.js` | What's remembered in the browser (whether the intro has been seen). |
| `src/scenes/GameScene.js` | Builds the level, camera, goal flag, pits and restarts. |

## Publishing

Every push to `main` builds the game and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The built game is plain static files in `dist/`,
so it can also be uploaded to any web host or embedded in a website with an `<iframe>`.
