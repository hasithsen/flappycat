# FlappyCat Asset Placeholders

Every file in this folder is a **placeholder** generated as a simple SVG.
Swap any of them with your own art (SVG, PNG, JPG, WebP, …) by following the
rules below. The game will pick up your replacement automatically as long as
the **filename and recommended dimensions stay the same**.

If you change a file extension (e.g. `cat.svg` → `cat.png`), update the matching
entry in `js/scenes/PreloadScene.js` — that is the only place asset paths live.

| File                  | Used for                              | Recommended size (px) | Notes                                          |
| --------------------- | ------------------------------------- | --------------------- | ---------------------------------------------- |
| `background.svg`      | Sky behind everything                 | 480 × 720             | Will be center-cropped to game viewport.       |
| `ground.svg`          | Tiling ground strip (scrolls)         | 48 × 112              | Must tile cleanly horizontally.                |
| `cat.svg`             | Player character                      | 64 × 48               | Origin is centered; physics body is auto-fit.  |
| `halo.svg`            | Halo above the cat as it ascends      | 64 × 24               | Drawn behind the cat's head on death.          |
| `pipe-cap.svg`        | End cap of every pipe                 | 88 × 36               | A few px wider than the body looks classic.    |
| `pipe-body.svg`       | Tiling pipe shaft                     | 80 × 32               | Must tile cleanly vertically.                  |
| `logo.svg`            | Title shown on the menu               | 360 × 96              | Transparent background recommended.            |
| `panel.svg`           | Score panel on the game-over screen   | 280 × 160             | 9-slice friendly rounded panel.                |
| `button-play.svg`     | Play / Retry button                   | 140 × 56              |                                                |
| `tap-hint.svg`        | "Tap to start" hand icon              | 120 × 140             |                                                |
| `medal-bronze.svg`    | Awarded at score ≥ 10                 | 64 × 64               |                                                |
| `medal-silver.svg`    | Awarded at score ≥ 20                 | 64 × 64               |                                                |
| `medal-gold.svg`      | Awarded at score ≥ 30                 | 64 × 64               |                                                |
| `medal-platinum.svg`  | Awarded at score ≥ 40                 | 64 × 64               |                                                |
| `particle.svg`        | Death-burst particle                  | 16 × 16               | Tinted at runtime; transparent BG recommended. |

## Tips when replacing

- **Keep aspect ratios.** Physics hitboxes are derived from texture dimensions.
  Drifting too far from the recommended sizes will throw off collisions.
- **Trim transparent margins** on the `cat`, `pipe-cap` and `particle` textures
  for tight hitboxes.
- The pipe and ground textures **must tile seamlessly** on their tiling axis,
  otherwise you'll see visible seams while scrolling.
- For best results on high-DPI displays, ship 2× or 3× raster art (e.g.
  `cat@2x.png`) and update `PreloadScene.js` to reference it — Phaser's scale
  manager will handle the rest.
