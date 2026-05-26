/* global window, Phaser, FlappyCat */
/**
 * GameOverScene
 * -------------
 * Final-score summary with medal, best-score tracking and a one-tap retry.
 *
 * Animation choreography:
 *   1.  "GAME OVER" drops in from above.
 *   2.  Score panel slides up from below.
 *   3.  Final score counts up from 0 (gives players a satisfying beat).
 *   4.  Medal pops in (with a "NEW!" badge if best was beaten).
 *   5.  Play button fades in and is fully interactive.
 */
(function (root) {
  'use strict';
  const FlappyCat = root.FlappyCat || (root.FlappyCat = {});
  const { CFG } = FlappyCat;
  const K = CFG.KEYS;

  class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    init(data) {
      // Phaser reuses the scene instance between scene.start() calls, so any
      // flag set during a previous run is still set when we come back. Reset
      // everything that gates input/navigation here, or the second retry
      // silently no-ops.
      this._navigating = false;

      this.finalScore = (data && Number.isFinite(data.score)) ? (data.score | 0) : 0;
      this.previousBest = FlappyCat.util.loadBest();
      this.isNewBest = this.finalScore > this.previousBest;
      this.bestToShow = Math.max(this.previousBest, this.finalScore);
      if (this.isNewBest) FlappyCat.util.saveBest(this.finalScore);
    }

    create() {
      const { width, height } = this.scale;
      // Fade in from the same warm cream the GameScene faded *out* to on death.
      // Using black here would cause a one-frame cream → black blink.
      const [fr, fg, fb] = CFG.HEAVEN.FADE_RGB;
      this.cameras.main.fadeIn(180, fr, fg, fb);

      this.add.image(width / 2, height / 2, K.BG)
        .setDisplaySize(width, height).setDepth(-10);
      this.add.tileSprite(width / 2, height - CFG.GROUND_HEIGHT / 2,
        width, CFG.GROUND_HEIGHT, K.GROUND).setDepth(10);

      this._buildTitle();
      this._buildPanel();
      this._buildPlayButton();
      this._wireInputAfter(900);
    }

    /* ----------------------------------------------------------------- */
    /*  UI builders                                                       */
    /* ----------------------------------------------------------------- */

    _buildTitle() {
      const { width, height } = this.scale;

      const title = this.add.text(width / 2, -60, 'GAME OVER', {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '52px',
        color: '#ffffff',
        stroke: '#1a2a3a',
        strokeThickness: 9,
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: title,
        y: height * 0.16,
        duration: 600,
        ease: 'Bounce.easeOut',
      });
    }

    _buildPanel() {
      const { width, height } = this.scale;
      const panelY = height * 0.50;

      // Panel container (slides up from below).
      const panel = this.add.container(width / 2, height + 200).setDepth(15);

      const bg = this.add.image(0, 0, K.PANEL);
      panel.add(bg);

      // Layout reference inside 280x160 panel
      const labelStyle = {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '14px',
        color: '#7a4a14',
      };
      const valueStyle = {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '34px',
        color: '#1a2a3a',
      };

      // Medal slot (left)
      const medalKey = FlappyCat.util.medalForScore(this.finalScore);
      const medalSlot = this.add.circle(-86, 18, 36, 0xfff7e6, 0.85)
        .setStrokeStyle(2, 0xc79a4a);
      panel.add(medalSlot);

      let medal = null;
      if (medalKey) {
        medal = this.add.image(-86, 18, medalKey).setScale(0);
        panel.add(medal);
      } else {
        // No medal earned — show "no medal" hint.
        const noMedal = this.add.text(-86, 18, '—', { ...valueStyle, color: '#c79a4a' })
          .setOrigin(0.5);
        panel.add(noMedal);
      }

      // SCORE column (right) ---------------------------------------------
      const scoreLabel = this.add.text(36, -22, 'SCORE', labelStyle).setOrigin(0, 0.5);
      const scoreValue = this.add.text(120, -2, '0', valueStyle).setOrigin(1, 0.5);
      panel.add([scoreLabel, scoreValue]);

      const bestLabel  = this.add.text(36, 36, 'BEST', labelStyle).setOrigin(0, 0.5);
      const bestValue  = this.add.text(120, 56, String(this.bestToShow), valueStyle).setOrigin(1, 0.5);
      panel.add([bestLabel, bestValue]);

      // NEW! badge (only if beaten)
      if (this.isNewBest) {
        const badge = this.add.container(86, 56);
        const bgBadge = this.add.graphics();
        bgBadge.fillStyle(0xe23a3a, 1).fillRoundedRect(-22, -10, 44, 20, 6);
        bgBadge.lineStyle(2, 0xffffff, 0.9).strokeRoundedRect(-22, -10, 44, 20, 6);
        const txt = this.add.text(0, 0, 'NEW!', {
          fontFamily: '"Trebuchet MS", system-ui, sans-serif',
          fontStyle: '900',
          fontSize: '12px',
          color: '#ffffff',
        }).setOrigin(0.5);
        badge.add([bgBadge, txt]);
        badge.setAlpha(0).setScale(0.6);
        panel.add(badge);

        this.tweens.add({
          targets: badge,
          alpha: 1, scale: 1,
          delay: 1100, duration: 260, ease: 'Back.easeOut',
        });
        this.tweens.add({
          targets: badge,
          angle: { from: -6, to: 6 },
          delay: 1400, duration: 520, ease: 'Sine.easeInOut',
          yoyo: true, repeat: -1,
        });
      }

      // Slide panel up
      this.tweens.add({
        targets: panel,
        y: panelY,
        duration: 480, ease: 'Back.easeOut', delay: 220,
      });

      // Count score up from 0 once panel arrives
      this.time.delayedCall(720, () => {
        const counter = { v: 0 };
        const target = this.finalScore;
        const dur = Math.min(900, 220 + target * 28);
        this.tweens.add({
          targets: counter,
          v: target,
          duration: dur,
          ease: 'Cubic.easeOut',
          onUpdate: () => scoreValue.setText(String(counter.v | 0)),
        });
      });

      // Pop medal in
      if (medal) {
        this.time.delayedCall(900, () => {
          this.tweens.add({
            targets: medal,
            scale: { from: 0, to: 1 },
            angle: { from: -180, to: 0 },
            duration: 480, ease: 'Back.easeOut',
          });
          // Subtle ongoing shine wobble
          this.tweens.add({
            targets: medal,
            angle: { from: -4, to: 4 },
            delay: 1300, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        });
      }
    }

    _buildPlayButton() {
      const { width, height } = this.scale;

      this.playBtn = this.add.image(width / 2, height * 0.74, K.BUTTON_PLAY)
        .setDepth(20).setAlpha(0).setScale(0.9);

      this.tweens.add({
        targets: this.playBtn,
        alpha: 1, scale: 1,
        delay: 900, duration: 280, ease: 'Back.easeOut',
      });

      this.menuBtn = this.add.text(width / 2, height * 0.74 + 56, 'menu', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#1a2a3a',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(20).setAlpha(0);
      this.tweens.add({ targets: this.menuBtn, alpha: 0.9, delay: 1100, duration: 220 });

      this.tapAnyHint = this.add.text(width / 2, height - CFG.GROUND_HEIGHT - 16,
        'tap / space — play again', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#1a2a3a',
        }).setOrigin(0.5).setAlpha(0).setDepth(11);
      this.tweens.add({ targets: this.tapAnyHint, alpha: 0.7, delay: 1100, duration: 220 });
    }

    /* ----------------------------------------------------------------- */
    /*  Input                                                             */
    /* ----------------------------------------------------------------- */

    _wireInputAfter(delayMs) {
      this.time.delayedCall(delayMs, () => {
        this.playBtn.setInteractive({ useHandCursor: true });
        this.menuBtn.setInteractive({ useHandCursor: true });

        const restart = () => this._restart();
        const toMenu  = () => this._toMenu();

        this.playBtn.on('pointerover', () => this.tweens.add({ targets: this.playBtn, scale: 1.06, duration: 120 }));
        this.playBtn.on('pointerout',  () => this.tweens.add({ targets: this.playBtn, scale: 1.00, duration: 120 }));
        this.playBtn.on('pointerdown', () => this.tweens.add({ targets: this.playBtn, scale: 0.92, duration: 80, yoyo: true, onComplete: restart }));

        this.menuBtn.on('pointerdown', toMenu);

        // Background tap anywhere also restarts (classic flappy behaviour).
        this.input.on('pointerdown', (_pointer, currentlyOver) => {
          if (currentlyOver.length === 0) restart();
        });

        this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) restart(); });
        this.input.keyboard.on('keydown-UP',    e => { if (!e.repeat) restart(); });
        this.input.keyboard.on('keydown-W',     e => { if (!e.repeat) restart(); });
        this.input.keyboard.on('keydown-ENTER', e => { if (!e.repeat) restart(); });
        this.input.keyboard.on('keydown-ESC',   e => { if (!e.repeat) toMenu(); });
      });
    }

    _restart() {
      if (this._navigating) return;
      this._navigating = true;
      this.cameras.main.fadeOut(160, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('GameScene'));
    }

    _toMenu() {
      if (this._navigating) return;
      this._navigating = true;
      this.cameras.main.fadeOut(160, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('MenuScene'));
    }
  }

  FlappyCat.GameOverScene = GameOverScene;
})(window);
