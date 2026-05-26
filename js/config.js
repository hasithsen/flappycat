/* global window */
/**
 * Global, hand-tuned game configuration.
 *
 * Everything that affects "feel" lives here, on purpose: tweaking these
 * numbers shouldn't require reading the scene code. Keep them well-named.
 */
(function (root) {
  'use strict';

  const FlappyCat = root.FlappyCat || (root.FlappyCat = {});

  FlappyCat.CFG = Object.freeze({
    // ----- Viewport -----------------------------------------------------
    // Internal logical resolution; Phaser SCALE.FIT upsizes/downsizes
    // to the user's window while preserving this aspect ratio.
    WIDTH:  480,
    HEIGHT: 720,
    BG_COLOR: '#7ed4ff',

    // ----- World --------------------------------------------------------
    GRAVITY:        1600,   // px/s² downward acceleration
    MAX_FALL_SPEED: 700,    // px/s — clamps fall so collisions stay sane
    GROUND_HEIGHT:  112,    // taken from ground.svg height

    // ----- Player (the cat) --------------------------------------------
    CAT: {
      START_X: 120,
      START_Y_FRAC: 0.42,   // fraction of HEIGHT for spawn
      FLAP_VELOCITY: -460,  // upward impulse per tap
      HITBOX_SCALE: 0.78,   // shrinks physics body vs sprite — feels fair
      MAX_TILT_UP_DEG:   -28,
      MAX_TILT_DOWN_DEG:  90,
      TILT_TWEEN_MS: 90,    // snap-up tilt on flap
    },

    // ----- Pipes --------------------------------------------------------
    PIPE: {
      SCROLL_SPEED:   200,  // px/s leftward
      SPAWN_INTERVAL: 1450, // ms between spawns
      GAP_BASE:       170,  // gap between top and bottom pipes (px)
      GAP_MIN:        130,  // gap shrinks slightly as score grows
      GAP_DECAY_PER_SCORE: 0.6, // px less per +1 score until GAP_MIN
      MARGIN_TOP:     56,   // min distance from gap to ceiling
      MARGIN_BOTTOM:  56,   // min distance from gap to ground
      BODY_WIDTH:     80,   // matches pipe-body.svg width
      CAP_WIDTH:      88,   // matches pipe-cap.svg width
      CAP_HEIGHT:     36,
    },

    // ----- Difficulty curve --------------------------------------------
    // Pipes speed up slightly with score for that addictive ramp.
    DIFFICULTY: {
      SPEED_PER_SCORE: 1.6,  // px/s added to scroll speed per +1 score
      MAX_SPEED:       300,  // hard cap
    },

    // ----- Scoring & meta ---------------------------------------------
    BEST_SCORE_KEY: 'flappycat:bestScore',
    MEDAL_THRESHOLDS: [
      { score: 40, key: 'medal-platinum' },
      { score: 30, key: 'medal-gold'     },
      { score: 20, key: 'medal-silver'   },
      { score: 10, key: 'medal-bronze'   },
    ],

    // ----- Polish -------------------------------------------------------
    // Heaven death sequence (no explosion / shake — the cat ascends peacefully).
    HEAVEN: {
      FLASH_MS:        420,                // soft warm flash on impact
      FLASH_RGB:       [255, 240, 200],    // warm white-gold
      ASCENT_MS:       2000,               // how long the cat takes to leave the screen
      ASCENT_RISE_PX:  640,                // total vertical distance travelled while ascending
      SWAY_AMPLITUDE:  9,                  // horizontal float, px each side
      SWAY_PERIOD_MS:  1100,               // full sway cycle
      HALO_OFFSET_Y:   -22,                // how far above the cat the halo sits
      HALO_POP_MS:     320,                // halo pop-in tween duration
      ANGLE_SWAY_DEG:  6,                  // gentle tilt during ascent
      FADE_OUT_MS:     320,
      FADE_RGB:        [255, 248, 220],    // fade to warm cream before game-over
    },

    // Asset key constants — single source of truth, used by every scene.
    KEYS: {
      BG:           'background',
      GROUND:       'ground',
      CAT:          'cat',
      HALO:         'halo',
      PIPE_BODY:    'pipe-body',
      PIPE_CAP:     'pipe-cap',
      LOGO:         'logo',
      PANEL:        'panel',
      BUTTON_PLAY:  'button-play',
      TAP_HINT:     'tap-hint',
      PARTICLE:     'particle',
      MEDAL_BRONZE: 'medal-bronze',
      MEDAL_SILVER: 'medal-silver',
      MEDAL_GOLD:   'medal-gold',
      MEDAL_PLAT:   'medal-platinum',
    },
  });

  // Small utility helpers shared by scenes.
  FlappyCat.util = {
    /** Read best score from localStorage, never throws. */
    loadBest() {
      try {
        const v = parseInt(root.localStorage.getItem(FlappyCat.CFG.BEST_SCORE_KEY), 10);
        return Number.isFinite(v) && v >= 0 ? v : 0;
      } catch (_) { return 0; }
    },
    /** Persist best score, never throws (e.g. private mode). */
    saveBest(score) {
      try {
        root.localStorage.setItem(FlappyCat.CFG.BEST_SCORE_KEY, String(score | 0));
      } catch (_) { /* no-op */ }
    },
    /** Compute the medal key (or null) for a given score. */
    medalForScore(score) {
      const t = FlappyCat.CFG.MEDAL_THRESHOLDS.find(t => score >= t.score);
      return t ? t.key : null;
    },
    /** Linear interpolation. */
    lerp(a, b, t) { return a + (b - a) * t; },
    /** Clamp helper. */
    clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; },
  };
})(window);
