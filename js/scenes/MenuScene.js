/* global window, Phaser, FlappyCat */
/**
 * MenuScene
 * ---------
 * Title screen with hovering cat, scrolling ground, best-score readout and
 * tap-to-start. Looks alive (everything is gently animated) so it doesn't
 * feel like a static splash.
 */
(function (root) {
  'use strict';
  const FlappyCat = root.FlappyCat || (root.FlappyCat = {});
  const { CFG } = FlappyCat;
  const K = CFG.KEYS;

  class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
      const { width, height } = this.scale;

      // Phaser keeps scene instances alive across scene.start() calls — any
      // flag we set lives forever unless we reset it here.
      this._started = false;

      this.cameras.main.fadeIn(180, 0, 0, 0);

      this.bg = this.add.image(width / 2, height / 2, K.BG)
        .setDisplaySize(width, height)
        .setDepth(-10);

      this.groundY = height - CFG.GROUND_HEIGHT;
      this.ground = this.add.tileSprite(width / 2, height - CFG.GROUND_HEIGHT / 2,
        width, CFG.GROUND_HEIGHT, K.GROUND).setDepth(10);

      // Logo
      const logo = this.add.image(width / 2, height * 0.20, K.LOGO).setDepth(5);
      this.tweens.add({
        targets: logo,
        y: logo.y + 6,
        duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });

      // Best score readout
      const best = FlappyCat.util.loadBest();
      this.add.text(width / 2, height * 0.31, `BEST  ${best}`, {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#1a2a3a',
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(5);

      // Hover cat
      this.cat = this.add.image(width / 2, height * 0.50, K.CAT).setDepth(5);
      this.tweens.add({
        targets: this.cat,
        y: this.cat.y + 14,
        duration: 620, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });
      this.tweens.add({
        targets: this.cat,
        angle: { from: -6, to: 6 },
        duration: 1240, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });

      // Tap-to-start hint
      this.tap = this.add.image(width / 2 + 40, height * 0.66, K.TAP_HINT)
        .setDepth(5).setScale(0.9);
      this.tweens.add({
        targets: this.tap,
        scale: { from: 0.9, to: 1.02 },
        duration: 520, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });

      this.add.text(width / 2, height * 0.79, 'TAP TO START', {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '26px',
        color: '#ffffff',
        stroke: '#1a2a3a',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(5);

      // Footer hint
      this.add.text(width / 2, height - CFG.GROUND_HEIGHT - 16,
        'space / up / w   ·   click / tap', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#1a2a3a',
      }).setOrigin(0.5).setAlpha(0.6).setDepth(11);

      // Start the game on any input
      const start = () => {
        if (this._started) return;
        this._started = true;
        this.cameras.main.fadeOut(140, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('GameScene');
        });
      };
      this.input.once('pointerdown', start);
      this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) start(); });
      this.input.keyboard.on('keydown-UP',    e => { if (!e.repeat) start(); });
      this.input.keyboard.on('keydown-W',     e => { if (!e.repeat) start(); });
      this.input.keyboard.on('keydown-ENTER', e => { if (!e.repeat) start(); });
    }

    update(_t, dt) {
      // Lazy parallax — just the ground for the menu, gives life cheaply.
      this.ground.tilePositionX += (CFG.PIPE.SCROLL_SPEED * 0.6) * (dt / 1000);
    }
  }

  FlappyCat.MenuScene = MenuScene;
})(window);
