import { HEAD_SECURITY as HS, TILE } from '../config.js';

const ART_SCALE = 0.5; // drawn at the hero's pixel size; every frame faces left

// The head of security: a bigger bouncer who patrols like the others, but when he sees Boris in
// front of him on his floor he points and shouts, charges head down, and throws a punch once he's
// close. If the punch misses he skids to a stop and goes back to walking. Two stomps (or two
// rubber ducks) knock him out.
//
// state: 'idle' (off screen, not moving yet), 'walk', 'spot', 'charge', 'punch', 'skid', 'dazed'
export default class HeadSecurity {
  constructor(scene, positions, layer) {
    this.scene = scene;
    this.layer = layer;
    this.group = scene.physics.add.group();
    for (const { x, y } of positions) {
      const chief = this.group.create(x, y, 'hos-walk-0').setOrigin(0.5, 1).setScale(ART_SCALE);
      chief.body.setSize(24, 52).setOffset(20, 8); // picture pixels: 12x26 in the world, centred
      chief.dir = -1;
      chief.state = 'idle';
      chief.until = 0;
      chief.restUntil = 0;
      chief.hits = 0;
      chief.frameAt = 0;
    }
    scene.physics.add.collider(this.group, layer);
  }

  update() {
    const { scene } = this;
    const now = scene.time.now;
    const view = scene.cameras.main.worldView;
    const player = scene.player;
    this.group.children.each((chief) => {
      if (!chief.body.enable) return;
      const body = chief.body;
      if (chief.y > scene.physics.world.bounds.bottom + 64) return chief.destroy();

      if (chief.state === 'idle') {
        if (chief.x > view.right + 24 || chief.x < view.left - 24) return;
        chief.dir = player.x < chief.x ? -1 : 1;
        this.setState(chief, 'walk');
      }

      const dx = player.x - chief.x;
      const sameFloor = Math.abs(player.body.bottom - body.bottom) < 10;
      const inFront = dx * chief.dir > 0;
      const blockedAhead = body.blocked.down && this.blockedAhead(chief);

      switch (chief.state) {
        case 'walk':
          if (blockedAhead) chief.dir = -chief.dir;
          body.setVelocityX(chief.dir * HS.walkSpeed);
          this.animate(chief, 'hos-walk', HS.stepMs);
          if (!player.dead && now >= chief.restUntil && sameFloor && inFront && Math.abs(dx) < HS.sightTiles * TILE) {
            this.setState(chief, 'spot', HS.spotMs);
          }
          break;
        case 'spot':
          body.setVelocityX(0);
          if (chief.exclaim) chief.exclaim.setPosition(chief.x + chief.dir * 2, chief.y - 32);
          if (now >= chief.until) this.setState(chief, 'charge', HS.chargeMaxMs);
          break;
        case 'charge':
          body.setVelocityX(chief.dir * HS.chargeSpeed);
          this.animate(chief, 'hos-charge', HS.chargeStepMs);
          if (!player.dead && inFront && Math.abs(dx) < HS.punchTiles * TILE && Math.abs(player.body.bottom - body.bottom) < 24) {
            this.punch(chief);
          } else if (blockedAhead || !inFront || now >= chief.until) {
            this.setState(chief, 'skid', HS.skidMs); // ran past, hit a wall or the edge, or gave up
          }
          break;
        case 'punch':
          body.setVelocityX(0);
          if (now >= chief.until) this.setState(chief, 'skid', HS.skidMs / 2);
          break;
        case 'skid':
          // Slides to a stop, turning round if Boris got behind him.
          body.setVelocityX(blockedAhead ? 0 : body.velocity.x * 0.9);
          if (now >= chief.until) {
            if (!player.dead) chief.dir = dx < 0 ? -1 : 1;
            chief.restUntil = now + HS.restMs;
            this.setState(chief, 'walk');
          }
          break;
        case 'dazed':
          body.setVelocityX(0);
          if (now >= chief.until) {
            chief.restUntil = now + HS.restMs / 2;
            this.setState(chief, 'walk');
          }
          break;
      }
      chief.setFlipX(chief.dir > 0);
    });
  }

  // A wall, or where the floor ends one step ahead.
  blockedAhead(chief) {
    const body = chief.body;
    const aheadX = chief.x + chief.dir * (body.halfWidth + 2);
    const floor = this.layer.getTileAtWorldXY(aheadX, body.bottom + 2);
    return (chief.dir < 0 ? body.blocked.left : body.blocked.right) || !floor?.collides;
  }

  setState(chief, state, ms = 0) {
    chief.state = state;
    chief.until = this.scene.time.now + ms;
    chief.exclaim?.destroy();
    chief.exclaim = null;
    if (state === 'walk') chief.setTexture('hos-walk-0');
    if (state === 'skid') chief.setTexture('hos-walk-0');
    if (state === 'dazed') chief.setTexture('hos-knocked');
    if (state === 'spot') {
      chief.setTexture('hos-spot');
      chief.exclaim = this.scene.add.image(chief.x, chief.y - 32, 'hos-exclaim').setOrigin(0.5, 1).setScale(0).setDepth(5);
      this.scene.tweens.add({ targets: chief.exclaim, scale: 0.5, duration: 150, ease: 'Back.easeOut' });
    }
  }

  // Swap between the two frames of a pose every ms.
  animate(chief, pose, ms) {
    const now = this.scene.time.now;
    if (now < chief.frameAt && chief.texture.key.startsWith(pose)) return;
    chief.frameAt = now + ms;
    chief.setTexture(chief.texture.key === `${pose}-0` ? `${pose}-1` : `${pose}-0`);
  }

  // Arm out; it lands if Boris is within reach of the fist.
  punch(chief) {
    const player = this.scene.player;
    this.setState(chief, 'punch', HS.punchMs);
    chief.setTexture('hos-punch');
    const reach = (player.x - chief.x) * chief.dir;
    if (reach > 0 && reach < HS.punchReach + player.body.halfWidth) player.punchedFrom(chief.x);
  }

  // Walked into: mid-charge that's a punch, otherwise he shoves you like a bouncer.
  touched(chief) {
    const player = this.scene.player;
    chief.dir = player.x < chief.x ? -1 : 1;
    if (chief.state === 'charge' || chief.state === 'spot') return this.punch(chief);
    if (chief.state === 'punch' || chief.state === 'dazed') return;
    player.shovedFrom(chief.x);
    this.setState(chief, 'skid', HS.skidMs);
  }

  // Coming down on his head from above (rather than walking into him).
  isStomp(player, chief) {
    return player.body.velocity.y > 0 && player.body.bottom < chief.body.top + 8;
  }

  // Stomped (dir 0) or hit by a rubber duck (dir ±1). The first one dazes him, the second one
  // knocks him out.
  hit(chief, dir) {
    const now = this.scene.time.now;
    if (now < (chief.hitSafeUntil ?? 0)) return;
    chief.hitSafeUntil = now + 250;
    chief.hits += 1;
    if (chief.hits < HS.hits) {
      this.setState(chief, 'dazed', HS.dazedMs);
      this.scene.tweens.add({ targets: chief, alpha: 0.4, duration: 80, yoyo: true, repeat: 2 });
      return;
    }
    chief.body.enable = false;
    chief.exclaim?.destroy();
    chief.setTexture('hos-knocked');
    if (dir === 0) {
      this.scene.tweens.add({
        targets: chief,
        scaleY: ART_SCALE * 0.3,
        scaleX: ART_SCALE * 1.3,
        alpha: 0,
        delay: 120,
        duration: 300,
        onComplete: () => chief.destroy(),
      });
      return;
    }
    chief.setFlipX(dir < 0);
    this.scene.tweens.add({
      targets: chief,
      x: chief.x + dir * 50,
      y: chief.y - 30,
      angle: dir * 90,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: chief,
          y: chief.y + 220,
          x: chief.x + dir * 30,
          angle: dir * 200,
          duration: 700,
          ease: 'Quad.easeIn',
          onComplete: () => chief.destroy(),
        }),
    });
  }
}
