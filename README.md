# 🧠 Cortex Console

A personal, MRI-informed brain-training arcade — eight drills, each targeting
a specific region measured on a real FreeSurfer scan (30F, Potvin 2016 +
CentileBrain 2024 normative comparison). Progress (XP, levels, badges,
streak) is stored in the browser's `localStorage`.

This is a full React rewrite of an earlier single-file prototype, with
**Rhythm Recall** (a Simon-says drum-kit memory game, originally its own
`drum_hippocampus_game` prototype) folded in as a third hippocampus drill.

## The drills

| Region | Drill | What it trains |
|---|---|---|
| Visual Cortex | **Flash Focus** | Rapid orientation discrimination — spot the odd-angled tile before it vanishes |
| Auditory Cortex | **Tone Trace** | Growing tone-sequence recall, plus a pitch-discrimination staircase |
| Putamen (Motor) | **Motor Chain** | Directional sequence learning — watch reaction time drop across identical reps |
| Word-Form Area | **Word Blitz** | Rapid flashed-word ID, interleaved with a Stroop ink-color trap |
| Hippocampus | **Trace Map** | Spatial paired-associate memory — hold shape-location pairs through a growing delay, then tap-to-swap them back |
| Hippocampus | **Trace Map: Hard Mode** | The real Corsi block-tapping test — identical tiles, position only, nothing to name |
| Hippocampus | **Rhythm Recall** | Simon-says on a synthesized 5-piece drum kit — working memory into motor pattern |
| Hippocampus | **Four Peaks** | The Four Mountains Test format — recognize the same skyline from a rotated viewpoint. Allocentric spatial memory specifically |

## Run it

Requires [Node.js](https://nodejs.org) (v18+).

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To build a static production bundle:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the built bundle locally
```

## Project structure

```
brain_games/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # React root
    ├── App.jsx                # view routing, HUD, modals
    ├── styles.css             # design tokens + every component's styles
    ├── hooks/
    │   └── useGameState.js    # XP/level/badge/streak state, backed by localStorage
    ├── data/
    │   ├── regions.js         # region → drill mapping, blurbs, XP routing
    │   └── scanData.js        # the exact scan tables shown in the "Scan Data" modal
    ├── audio/
    │   ├── tones.js           # pure-tone synth for Tone Trace
    │   └── drums.js           # synthesized 5-piece drum kit for Rhythm Recall
    ├── components/            # Hud, Dashboard, BrainMap, GameGrid, Badges, Landscape,
    │                           # ScanModal, ResetModal, GameHeader, HoldBar, icons
    └── games/                 # one file per drill
```

## Notes

- All audio (tones and drums) is synthesized live with the Web Audio API —
  no sample files anywhere.
- Browsers require a user gesture before audio can start; this is handled
  automatically on first interaction.
- This is a personal engagement tool, not a diagnostic or medical device —
  see the in-app disclaimer for the exact framing.
