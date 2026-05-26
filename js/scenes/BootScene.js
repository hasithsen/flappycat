/* global window, Phaser, FlappyCat */
/**
 * BootScene
 * ---------
 * Minimal first scene. We use it to (a) configure the loader for the rest of
 * the game (paths, retries, CORS) and (b) generate any procedural textures
 * we need before Preload's progress bar can run.
 */
(function (root) {
  'use strict';
  const FlappyCat = root.FlappyCat || (root.FlappyCat = {});

  class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
      this.load.setBaseURL('');
      this.load.setPath('');
      this.load.crossOrigin = undefined;
    }

    create() {
      // Tiny 4x4 white pixel used by the death-flash overlay and other tints.
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
      g.generateTexture('pixel', 4, 4);
      g.destroy();

      this.scene.start('PreloadScene');
    }
  }

  FlappyCat.BootScene = BootScene;
})(window);
