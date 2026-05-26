/* global window, Phaser, FlappyCat */
/**
 * GameScene
 * ---------
 * The actual game loop: physics-driven cat, scrolling pipes, scoring, death.
 *
 * State machine
 *   READY    – cat hovers in place, waiting for the first flap.
 *   PLAYING  – gravity on, pipes spawning, score counting.
 *   DEAD     – player has died; everything freezes, cat falls.
 *
 * Collision is hand-rolled AABB so the pipes (which are composed of multiple
 * sprites + a tiling body) can be moved as one unit without fighting the
 * physics engine.
 */
(function (root) {
  'use strict';
  const FlappyCat = root.FlappyCat || (root.FlappyCat = {});
  const { CFG } = FlappyCat;
  const K = CFG.KEYS;

  /* ------------------------------------------------------------------ */
  /*  PipePair — a top + bottom pipe scrolling left as one unit         */
  /* ------------------------------------------------------------------ */
  class PipePair {
    constructor(scene, x, gapY, gapSize, groundY) {
      this.scene = scene;
      this.x = x;
      this.scored = false;

      const bodyW = CFG.PIPE.BODY_WIDTH;
      const capW  = CFG.PIPE.CAP_WIDTH;
      const capH  = CFG.PIPE.CAP_HEIGHT;

      const topHeight    = Math.max(0, gapY - gapSize / 2);
      const bottomY      = gapY + gapSize / 2;
      const bottomHeight = Math.max(0, groundY - bottomY);

      // ---- TOP pipe ----------------------------------------------------
      const tBodyH = Math.max(0, topHeight - capH);
      this.topBody = scene.add.tileSprite(x, tBodyH / 2, bodyW, tBodyH, K.PIPE_BODY)
        .setDepth(4);
      this.topCap  = scene.add.image(x, topHeight - capH / 2, K.PIPE_CAP)
        .setDepth(4);

      // ---- BOTTOM pipe -------------------------------------------------
      this.bottomCap  = scene.add.image(x, bottomY + capH / 2, K.PIPE_CAP)
        .setDepth(4);
      // bBody top = bottomY + capH ; bBody bottom = bottomY + bottomHeight
      // → center  = bottomY + capH/2 + bottomHeight/2
      const bBodyH = Math.max(0, bottomHeight - capH);
      this.bottomBody = scene.add.tileSprite(x,
        bottomY + capH / 2 + bottomHeight / 2,
        bodyW, bBodyH, K.PIPE_BODY).setDepth(4);

      this.parts = [this.topBody, this.topCap, this.bottomBody, this.bottomCap];

      // ---- Collision rectangles (cap width — slightly wider than body) -
      this.topRect    = new Phaser.Geom.Rectangle(x - capW / 2, 0,                  capW, topHeight);
      this.bottomRect = new Phaser.Geom.Rectangle(x - capW / 2, bottomY,            capW, bottomHeight);
    }

    update(dx) {
      this.x += dx;
      for (let i = 0; i < this.parts.length; i++) this.parts[i].x += dx;
      this.topRect.x    += dx;
      this.bottomRect.x += dx;
    }

    isOffscreen() { return this.x < -CFG.PIPE.CAP_WIDTH; }

    destroy() {
      for (let i = 0; i < this.parts.length; i++) this.parts[i].destroy();
      this.parts.length = 0;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  GameScene                                                          */
  /* ------------------------------------------------------------------ */
  class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.fadeIn(120, 0, 0, 0);

      // Background and ground -------------------------------------------------
      this.add.image(width / 2, height / 2, K.BG)
        .setDisplaySize(width, height)
        .setDepth(-10);

      this.groundY = height - CFG.GROUND_HEIGHT;
      this.ground = this.add.tileSprite(width / 2, height - CFG.GROUND_HEIGHT / 2,
        width, CFG.GROUND_HEIGHT, K.GROUND).setDepth(20);

      // The Cat (arcade physics body) ---------------------------------------
      this.cat = this.physics.add.sprite(CFG.CAT.START_X, height * CFG.CAT.START_Y_FRAC, K.CAT)
        .setDepth(15);
      this.cat.body.setAllowGravity(false);
      this.cat.body.setCollideWorldBounds(false);

      const bw = this.cat.displayWidth  * CFG.CAT.HITBOX_SCALE;
      const bh = this.cat.displayHeight * CFG.CAT.HITBOX_SCALE;
      this.cat.body.setSize(bw, bh, true); // recentre

      // Hover idle while waiting for first flap
      this.hoverTween = this.tweens.add({
        targets: this.cat,
        y: this.cat.y + 10,
        duration: 480, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });

      // Score text (big, centred under the notch) ---------------------------
      this.scoreText = this.add.text(width / 2, 84, '0', {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '72px',
        color: '#ffffff',
        stroke: '#1a2a3a',
        strokeThickness: 10,
      }).setOrigin(0.5).setDepth(30);

      // Get-ready UI --------------------------------------------------------
      this.getReadyText = this.add.text(width / 2, height * 0.22, 'GET READY', {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '40px',
        color: '#ffffff',
        stroke: '#1a2a3a',
        strokeThickness: 7,
      }).setOrigin(0.5).setDepth(30);

      this.tapHint = this.add.image(width / 2 + 70, height * CFG.CAT.START_Y_FRAC, K.TAP_HINT)
        .setDepth(30).setScale(0.85);
      this.tweens.add({
        targets: this.tapHint,
        scale: { from: 0.85, to: 0.95 },
        duration: 520, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });

      // Pipes & state -------------------------------------------------------
      this.pipes        = [];
      this.score        = 0;
      this.state        = 'READY';
      this.scrollSpeed  = CFG.PIPE.SCROLL_SPEED;
      this._lastFlap    = 0;
      this._deathStartedAt = 0;

      // Phaser reuses the scene instance between scene.start() calls. The
      // tween/particle/image *objects* below were destroyed with the previous
      // scene shutdown, but our this.* references to them still exist and
      // would throw if methods were called on them. Null only the refs that
      // we don't re-assign during create() — pipeTimer/hoverTween are
      // assigned fresh later in the flow, so leave those alone here.
      this._angleTween   = null;
      this._deathX       = null;
      this.halo          = null;
      this.ascendEmitter = null;

      // The "ascend to heaven" sparkle trail is created on death so it can
      // be told to follow the cat directly. See _die().

      // Input ---------------------------------------------------------------
      this.input.on('pointerdown', () => this._tryFlap());
      this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) this._tryFlap(); });
      this.input.keyboard.on('keydown-UP',    e => { if (!e.repeat) this._tryFlap(); });
      this.input.keyboard.on('keydown-W',     e => { if (!e.repeat) this._tryFlap(); });

      // Cleanup on scene shutdown
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._teardown, this);
    }

    /* ----------------------------------------------------------------- */
    /*  Input / state transitions                                         */
    /* ----------------------------------------------------------------- */

    _tryFlap() {
      if (this.state === 'DEAD') return;

      // Tiny debounce so wild key-mashing doesn't break physics.
      const now = this.time.now;
      if (now - this._lastFlap < 80) return;
      this._lastFlap = now;

      if (this.state === 'READY') this._startPlaying();

      this.cat.body.setVelocityY(CFG.CAT.FLAP_VELOCITY);

      // Snap nose up on flap (we track the angle tween so the scale-pop
      // below isn't accidentally cancelled with it).
      if (this._angleTween && this._angleTween.isPlaying()) this._angleTween.stop();
      this._angleTween = this.tweens.add({
        targets: this.cat,
        angle: CFG.CAT.MAX_TILT_UP_DEG,
        duration: CFG.CAT.TILT_TWEEN_MS,
        ease: 'Sine.easeOut',
      });

      // Subtle scale-pop for "wing flap" feel.
      this.tweens.add({
        targets: this.cat,
        scaleY: { from: 0.9, to: 1 },
        scaleX: { from: 1.05, to: 1 },
        duration: 140, ease: 'Sine.easeOut',
      });
    }

    _startPlaying() {
      this.state = 'PLAYING';

      // Drop the get-ready overlay.
      this.tweens.add({
        targets: [this.getReadyText, this.tapHint],
        alpha: 0, y: '-=14',
        duration: 220, ease: 'Sine.easeIn',
        onComplete: () => { this.getReadyText.destroy(); this.tapHint.destroy(); },
      });

      // Stop the idle hover; gravity takes over.
      if (this.hoverTween) { this.hoverTween.stop(); this.hoverTween = null; }
      this.cat.body.setAllowGravity(true);
      this.cat.body.setGravityY(CFG.GRAVITY);

      // Pipe pacing.
      this.pipeTimer = this.time.addEvent({
        delay: CFG.PIPE.SPAWN_INTERVAL,
        loop: true,
        callback: () => this._spawnPipePair(),
      });
      // Spawn one immediately so the player has something to aim at.
      this._spawnPipePair();
    }

    /* ----------------------------------------------------------------- */
    /*  Per-frame update                                                  */
    /* ----------------------------------------------------------------- */

    update(_time, delta) {
      const dt = delta / 1000;

      if (this.state === 'READY') {
        this.ground.tilePositionX += this.scrollSpeed * dt;
        return;
      }

      if (this.state === 'PLAYING') {
        this._updateDifficulty();
        this.ground.tilePositionX += this.scrollSpeed * dt;
        this._updatePipes(dt);
        this._updateCat(dt);
        this._checkCollisions();
        return;
      }

      if (this.state === 'DEAD') {
        this._updateCatDying();
        return;
      }
    }

    /* ----------------------------------------------------------------- */
    /*  Subsystems                                                        */
    /* ----------------------------------------------------------------- */

    _updateDifficulty() {
      this.scrollSpeed = Math.min(
        CFG.DIFFICULTY.MAX_SPEED,
        CFG.PIPE.SCROLL_SPEED + this.score * CFG.DIFFICULTY.SPEED_PER_SCORE
      );
    }

    _updatePipes(dt) {
      const dx = -this.scrollSpeed * dt;
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const p = this.pipes[i];
        p.update(dx);

        if (!p.scored && p.x < this.cat.x) {
          p.scored = true;
          this._addScore();
        }
        if (p.isOffscreen()) {
          p.destroy();
          this.pipes.splice(i, 1);
        }
      }
    }

    _updateCat(_dt) {
      // Clamp fall speed for predictable feel.
      if (this.cat.body.velocity.y > CFG.MAX_FALL_SPEED) {
        this.cat.body.setVelocityY(CFG.MAX_FALL_SPEED);
      }

      // Soft ceiling — don't kill the player for hitting it, just stop them.
      if (this.cat.y < this.cat.displayHeight / 2 + 4) {
        this.cat.y = this.cat.displayHeight / 2 + 4;
        if (this.cat.body.velocity.y < 0) this.cat.body.setVelocityY(0);
      }

      // Tilt toward velocity while falling — gradual nose-dive.
      const vy = this.cat.body.velocity.y;
      if (vy > 0) {
        const target = FlappyCat.util.clamp(
          vy * 0.18, CFG.CAT.MAX_TILT_UP_DEG, CFG.CAT.MAX_TILT_DOWN_DEG
        );
        this.cat.angle = Phaser.Math.Linear(this.cat.angle, target, 0.07);
      }
    }

    _checkCollisions() {
      // Ground kills.
      if (this.cat.body.bottom >= this.groundY) {
        // Pull the sprite up by however much the body overflows the ground.
        this.cat.y -= (this.cat.body.bottom - this.groundY);
        return this._die();
      }
      // Pipes kill.
      const b = this.cat.body;
      const l = b.x, t = b.y, r = b.x + b.width, btm = b.y + b.height;
      for (let i = 0; i < this.pipes.length; i++) {
        const p = this.pipes[i];
        if (this._aabb(l, t, r, btm, p.topRect) ||
            this._aabb(l, t, r, btm, p.bottomRect)) {
          return this._die();
        }
      }
    }

    _aabb(l, t, r, b, rect) {
      return r > rect.x && l < rect.x + rect.width &&
             b > rect.y && t < rect.y + rect.height;
    }

    _spawnPipePair() {
      const { width } = this.scale;

      const gap = Math.max(
        CFG.PIPE.GAP_MIN,
        CFG.PIPE.GAP_BASE - this.score * CFG.PIPE.GAP_DECAY_PER_SCORE
      );
      const minY = CFG.PIPE.MARGIN_TOP    + gap / 2;
      const maxY = this.groundY - CFG.PIPE.MARGIN_BOTTOM - gap / 2;
      const gapY = Phaser.Math.Between(minY, maxY);
      const spawnX = width + CFG.PIPE.CAP_WIDTH;

      this.pipes.push(new PipePair(this, spawnX, gapY, gap, this.groundY));
    }

    _addScore() {
      this.score++;
      this.scoreText.setText(String(this.score));
      this.tweens.add({
        targets: this.scoreText,
        scale: { from: 1.25, to: 1 },
        duration: 220, ease: 'Back.easeOut',
      });
    }

    /* ----------------------------------------------------------------- */
    /*  Death sequence                                                    */
    /* ----------------------------------------------------------------- */

    _die() {
      if (this.state === 'DEAD') return;
      this.state = 'DEAD';
      this._deathStartedAt = this.time.now;

      if (this.pipeTimer) { this.pipeTimer.remove(); this.pipeTimer = null; }

      // (The state check in _tryFlap already swallows post-death input —
      //  no need to detach the listeners. The scene will shut them down
      //  cleanly when it stops.)

      const H = CFG.HEAVEN;

      // Freeze the cat's physics — the rest of the ascent is tween-driven.
      this.tweens.killTweensOf(this.cat);
      this.cat.body.setAllowGravity(false);
      this.cat.body.setVelocity(0, 0);
      this.cat.body.setGravityY(0);

      // Remember the death spot so the X sway can oscillate around it.
      this._deathX = this.cat.x;

      // Soft warm "heavenly" flash — no shake, no white blast.
      this.cameras.main.flash(H.FLASH_MS, H.FLASH_RGB[0], H.FLASH_RGB[1], H.FLASH_RGB[2]);

      // Halo above the cat's head: pops in, then pulses gently.
      this.halo = this.add.image(this.cat.x, this.cat.y + H.HALO_OFFSET_Y, K.HALO)
        .setDepth(this.cat.depth + 1)
        .setAlpha(0).setScale(0.2);
      this.tweens.add({
        targets: this.halo,
        alpha: 1, scale: 1,
        duration: H.HALO_POP_MS,
        ease: 'Back.easeOut',
      });
      this.tweens.add({
        targets: this.halo,
        scale: { from: 1, to: 1.08 },
        delay: H.HALO_POP_MS,
        duration: 720, ease: 'Sine.easeInOut',
        yoyo: true, repeat: -1,
      });

      // Sparkle trail rising from beneath the cat as it floats up.
      this.ascendEmitter = this.add.particles(0, 0, K.PARTICLE, {
        follow: this.cat,
        followOffset: { x: 0, y: 10 },
        speed:    { min: 18, max: 70 },
        angle:    { min: 250, max: 290 },         // 270° = straight up in Phaser
        lifespan: { min: 800, max: 1500 },
        scale:    { start: 0.9, end: 0 },
        alpha:    { start: 0.95, end: 0 },
        tint:     [0xfff7d6, 0xffe071, 0xffffff],
        gravityY: -30,
        frequency: 38,
        quantity: 1,
        rotate:   { min: 0, max: 360 },
      }).setDepth(14);

      // Settle the cat to upright, then let it gently sway as it rises.
      this.tweens.add({
        targets: this.cat,
        angle: 0,
        duration: 240, ease: 'Sine.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: this.cat,
            angle: { from: -H.ANGLE_SWAY_DEG, to: H.ANGLE_SWAY_DEG },
            duration: 1100, ease: 'Sine.easeInOut',
            yoyo: true, repeat: -1,
          });
        },
      });

      // The ascent itself: starts slow, accelerates upward like a sigh.
      this.tweens.add({
        targets: this.cat,
        y: this.cat.y - H.ASCENT_RISE_PX,
        duration: H.ASCENT_MS,
        ease: 'Quad.easeIn',
      });

      // Curtain call.
      this.time.delayedCall(H.ASCENT_MS - 80, () => {
        this.cameras.main.fadeOut(H.FADE_OUT_MS, H.FADE_RGB[0], H.FADE_RGB[1], H.FADE_RGB[2]);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('GameOverScene', { score: this.score });
        });
      });
    }

    _updateCatDying() {
      const H = CFG.HEAVEN;

      // Lazy sin-wave horizontal sway around the death point.
      if (this._deathX != null) {
        const t = (this.time.now - this._deathStartedAt) / H.SWAY_PERIOD_MS * Math.PI * 2;
        this.cat.x = this._deathX + Math.sin(t) * H.SWAY_AMPLITUDE;
      }
      // Keep the halo glued just above the cat's head.
      if (this.halo) {
        this.halo.x = this.cat.x;
        this.halo.y = this.cat.y + H.HALO_OFFSET_Y;
      }
    }

    /* ----------------------------------------------------------------- */
    /*  Cleanup                                                           */
    /* ----------------------------------------------------------------- */

    _teardown() {
      if (this.pipeTimer) { this.pipeTimer.remove(); this.pipeTimer = null; }
      for (let i = 0; i < this.pipes.length; i++) this.pipes[i].destroy();
      this.pipes.length = 0;
    }
  }

  FlappyCat.GameScene = GameScene;
  FlappyCat.PipePair  = PipePair;
})(window);
