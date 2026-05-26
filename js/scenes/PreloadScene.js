/* global window, Phaser, FlappyCat */
/**
 * PreloadScene
 * ------------
 * Loads every asset the game needs and shows a clean progress bar while it
 * does. This is the ONE place file paths live — if you swap a placeholder
 * for a PNG, change it here and only here.
 */
(function (root) {
  'use strict';
  const FlappyCat = root.FlappyCat || (root.FlappyCat = {});
  const { CFG } = FlappyCat;
  const K = CFG.KEYS;

  class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
      this._drawLoaderUI();
      this.load.setBaseURL('');
      this.load.setPath('');

      const asset = file => new URL(`assets/${file}`, root.document.baseURI).href;

      // SVG sizing — Phaser rasterises SVGs at the size we request, so we feed
      // it the *native* dimensions of each placeholder. If you swap an SVG for
      // a PNG/JPG, switch the call from `this.load.svg(...)` to
      // `this.load.image(key, 'your-file.png')` — the rest of the game stays
      // the same.
      this.load.svg(K.BG,           asset('background.svg'),     { width: 480, height: 720 });
      this.load.svg(K.GROUND,       asset('ground.svg'),         { width: 48,  height: 112 });
      this.load.svg(K.CAT,          asset('cat.svg'),            { width: 64,  height: 48  });
      this.load.svg(K.HALO,         asset('halo.svg'),           { width: 64,  height: 24  });
      this.load.svg(K.PIPE_BODY,    asset('pipe-body.svg'),      { width: 80,  height: 32  });
      this.load.svg(K.PIPE_CAP,     asset('pipe-cap.svg'),       { width: 88,  height: 36  });
      this.load.svg(K.LOGO,         asset('logo.svg'),           { width: 360, height: 96  });
      this.load.svg(K.PANEL,        asset('panel.svg'),          { width: 280, height: 160 });
      this.load.svg(K.BUTTON_PLAY,  asset('button-play.svg'),    { width: 140, height: 56  });
      this.load.svg(K.TAP_HINT,     asset('tap-hint.svg'),       { width: 120, height: 140 });
      this.load.svg(K.PARTICLE,     asset('particle.svg'),       { width: 16,  height: 16  });
      this.load.svg(K.MEDAL_BRONZE, asset('medal-bronze.svg'),   { width: 64,  height: 64  });
      this.load.svg(K.MEDAL_SILVER, asset('medal-silver.svg'),   { width: 64,  height: 64  });
      this.load.svg(K.MEDAL_GOLD,   asset('medal-gold.svg'),     { width: 64,  height: 64  });
      this.load.svg(K.MEDAL_PLAT,   asset('medal-platinum.svg'), { width: 64,  height: 64  });

      // Soft-fail any missing file so a typo doesn't blank the whole game.
      this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, file => {
        console.warn('[FlappyCat] Failed to load asset:', file.src);
      });
    }

    create() {
      // Tiny fade so the first frame of the menu doesn't pop.
      this.cameras.main.fadeOut(150, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('MenuScene');
      });
    }

    /* ------------------------------------------------------------------ */
    /*  Internals                                                          */
    /* ------------------------------------------------------------------ */

    _drawLoaderUI() {
      const { width, height } = this.scale;
      const cx = width / 2;
      const cy = height / 2;

      this.cameras.main.setBackgroundColor(CFG.BG_COLOR);

      this.add.text(cx, cy - 64, 'FLAPPYCAT', {
        fontFamily: '"Trebuchet MS", system-ui, sans-serif',
        fontStyle: '900',
        fontSize: '40px',
        color: '#1a2a3a',
      }).setOrigin(0.5);

      this.add.text(cx, cy - 30, 'loading…', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#1a2a3a',
      }).setOrigin(0.5).setAlpha(0.6);

      const barW = 240, barH = 14;
      const barX = cx - barW / 2;
      const barY = cy + 8;

      const frame = this.add.graphics();
      frame.lineStyle(2, 0x1a2a3a, 1).strokeRoundedRect(barX, barY, barW, barH, 6);

      const fill = this.add.graphics();
      this.load.on(Phaser.Loader.Events.PROGRESS, p => {
        fill.clear();
        fill.fillStyle(0xffae3a, 1).fillRoundedRect(barX + 2, barY + 2, (barW - 4) * p, barH - 4, 4);
      });

      const pct = this.add.text(cx, cy + 38, '0%', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#1a2a3a',
      }).setOrigin(0.5).setAlpha(0.7);
      this.load.on(Phaser.Loader.Events.PROGRESS, p => pct.setText(Math.round(p * 100) + '%'));
    }
  }

  FlappyCat.PreloadScene = PreloadScene;
})(window);
