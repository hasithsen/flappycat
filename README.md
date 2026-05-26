# FlappyCat

> Flappy Bird, but with a cat.
> A small, polished Phaser 3 game built from a single static folder — drop it on
> any web server (or just open `index.html` over a local file server) and play.

![placeholder art warning](https://img.shields.io/badge/sprites-placeholder-orange)

## Play

```bash
# Any static server works. Examples:
npx serve .
# or
python -m http.server 8000
# or
php -S localhost:8000
```

Then open <http://localhost:8000>.

> Opening `index.html` directly via `file://` works in some browsers but is
> not recommended — Phaser's loader prefers a real HTTP origin (especially
> for the SVG asset rasteriser).

## Controls

| Action      | Input                                       |
| ----------- | ------------------------------------------- |
| Flap        | `Space`, `↑`, `W`, or tap / click anywhere  |
| Start game  | Any flap input                              |
| Retry       | Tap, click `PLAY`, or `Space` / `Enter`     |
| Back to menu| `Esc` or the `menu` link on game-over       |

The game is fully playable with one finger and is sized for portrait
phone screens (480 × 720 logical), letterboxed responsively to any window.

## Repository layout

```
flappycat/
├── index.html              # entry point (loads Phaser via CDN)
├── assets/                 # all visuals are SVG placeholders — see assets/README.md
├── js/
│   ├── config.js           # all gameplay constants in one place
│   ├── main.js             # boots Phaser
│   └── scenes/
│       ├── BootScene.js    # generates the 1-pixel white texture
│       ├── PreloadScene.js # progress bar + the canonical list of asset paths
│       ├── MenuScene.js    # title, best-score, "tap to start"
│       ├── GameScene.js    # the loop: physics, pipes, scoring, death
│       └── GameOverScene.js# medal, best, retry
└── README.md
```

## Replacing the placeholder art

Every sprite under [`assets/`](./assets/) is a hand-rolled SVG placeholder. To
ship the real game, just drop your art in with the same filenames — the game
will pick it up automatically.

If you switch from SVG to PNG / JPG / WebP, change the matching
`this.load.svg(...)` call to `this.load.image(...)` in
[`js/scenes/PreloadScene.js`](./js/scenes/PreloadScene.js).

See [`assets/README.md`](./assets/README.md) for recommended dimensions and
tiling requirements per file.

## Tuning the "feel"

Every number that affects how the game plays lives in
[`js/config.js`](./js/config.js). Bump the gravity if it feels floaty, widen
the pipe gap if it's too punishing, tweak `DIFFICULTY.SPEED_PER_SCORE` to
change the ramp.

Defaults are picked to feel close to the original Flappy Bird: tight, punishing,
addictive.

## Adding sound (optional)

The audio system is initialised but **muted by default** because no audio
placeholders ship with the repo. To wire sound in:

1. Drop your audio files into `assets/` (e.g. `flap.wav`, `score.wav`, `hit.wav`, `die.wav`).
2. Load them in `PreloadScene.js`:
   ```js
   this.load.audio('flap',  'flap.wav');
   this.load.audio('score', 'score.wav');
   this.load.audio('hit',   'hit.wav');
   this.load.audio('die',   'die.wav');
   ```
3. In `GameScene.js`, set `audio: { noAudio: false }` in `js/main.js` and play sounds at the obvious hooks: `_tryFlap`, `_addScore`, `_die`.

## License

See [LICENSE](./LICENSE).
