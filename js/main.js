/* global window, Phaser, FlappyCat, document */
/**
 * Boot the Phaser game once the DOM and Phaser are ready.
 *
 * Notes:
 *   - We use SCALE.FIT to letterbox the fixed-aspect game on any window.
 *   - All scenes live on the global FlappyCat namespace and are added here in
 *     start-order. BootScene auto-starts; everything else is started by name.
 *   - On tab-hide we pause the active scene so background CPU stays at zero.
 */
(function () {
  'use strict';

  function start() {
    const splash = document.getElementById('splash');
    if (typeof Phaser === 'undefined') return; // index.html shows a fatal banner

    const CFG = FlappyCat.CFG;

    const config = {
      type:    Phaser.AUTO,
      parent:  'game',
      width:   CFG.WIDTH,
      height:  CFG.HEIGHT,
      backgroundColor: CFG.BG_COLOR,
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // Lock orientation feel: portrait aspect is enforced by FIT.
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // we apply gravity per-body so menu cat can hover
          debug: false,
        },
      },
      fps: {
        target: 60,
        forceSetTimeOut: false,
      },
      input: {
        activePointers: 2,
      },
      dom: { createContainer: false },
      audio: { disableWebAudio: false, noAudio: true },
      scene: [
        FlappyCat.BootScene,
        FlappyCat.PreloadScene,
        FlappyCat.MenuScene,
        FlappyCat.GameScene,
        FlappyCat.GameOverScene,
      ],
    };

    const game = new Phaser.Game(config);
    FlappyCat.game = game;

    // Pause/resume on tab visibility so we never burn CPU in the background.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) game.scene.scenes.forEach(s => s.scene.isActive() && s.scene.pause());
      else                 game.scene.scenes.forEach(s => s.scene.isPaused()   && s.scene.resume());
    });

    // Hide splash as soon as Boot fires its very first tick.
    game.events.once(Phaser.Core.Events.READY, () => {
      if (splash) splash.classList.add('hidden');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
