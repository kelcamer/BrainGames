import { useEffect, useMemo, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

// Block Builder — mental rotation / perspective-taking (allocentric spatial,
// a Hippocampus function). A random cube structure is shown in 3D from the
// front. Gravity is real: every column is filled from the ground up, so no
// cube ever floats. You're then asked what the same structure looks like from
// another side (back / left / right) and pick the correct elevation from four.
// Inspired by the Cyberchase block-view puzzles.

const rnd = (n) => Math.floor(Math.random() * n);

// ---- structure generation -------------------------------------------------
// heights[x][y] = number of stacked cubes on base cell (x = left→right,
// y = front→back). A column of height h is filled at levels 0..h-1 — gravity
// is automatic because height is a single count, not a per-level flag.
function makeStructure(n, hCap) {
  let heights, filled;
  do {
    heights = [];
    filled = 0;
    for (let x = 0; x < n; x++) {
      heights[x] = [];
      for (let y = 0; y < n; y++) {
        // Bias toward shorter/empty columns so structures stay readable.
        const h = Math.max(0, rnd(hCap + 2) - 1);
        heights[x][y] = Math.min(h, hCap);
        if (heights[x][y] > 0) filled++;
      }
    }
  } while (filled < n + 1 || maxH(heights) < 2); // reject trivial/flat structures
  return heights;
}

function maxH(heights) {
  let m = 0;
  for (const col of heights) for (const h of col) if (h > m) m = h;
  return m;
}

// ---- elevation profiles (what a flat side looks like) ---------------------
// Each returns an array of column heights, ordered left→right *as seen from
// that viewpoint*. Camera convention: viewer at front looks +y, x increases
// right, z is up. Right/left and back are the geometrically-correct rotations.
const N = (heights) => heights.length;

function frontProfile(h) {
  // looking from front (−y → +y): column x, height = tallest cube behind it
  return h.map((col) => Math.max(...col));
}
function backProfile(h) {
  // rotate 180°: mirror of the front
  return frontProfile(h).slice().reverse();
}
function rightProfile(h) {
  // viewer at +x looking −x: columns are y, front (y=0) on the left
  const n = N(h);
  const out = [];
  for (let y = 0; y < n; y++) {
    let m = 0;
    for (let x = 0; x < n; x++) m = Math.max(m, h[x][y]);
    out.push(m);
  }
  return out;
}
function leftProfile(h) {
  // viewer at −x looking +x: mirror of the right view
  return rightProfile(h).slice().reverse();
}

const VIEWS = {
  back: { label: "the BACK", fn: backProfile },
  left: { label: "the LEFT", fn: leftProfile },
  right: { label: "the RIGHT", fn: rightProfile },
};

// ---- profile → binary elevation grid (rows top→bottom) --------------------
function profileToGrid(profile, rows) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const heightAtRow = rows - r; // top row = tallest
    grid.push(profile.map((p) => (p >= heightAtRow ? 1 : 0)));
  }
  return grid;
}
const profileKey = (p) => p.join(",");

// Build four candidate profiles: the correct one plus three plausible wrongs
// (the other two side views, a mirror, and single-column ±1 perturbations).
function buildChoices(heights, targetKey) {
  const correct = VIEWS[targetKey].fn(heights);
  const cKey = profileKey(correct);
  const seen = new Set([cKey]);
  const distractors = [];

  const consider = (p) => {
    if (!p) return;
    const k = profileKey(p);
    if (!seen.has(k) && p.length === correct.length) {
      seen.add(k);
      distractors.push(p);
    }
  };

  // other genuine side views (a very tempting kind of wrong answer)
  Object.keys(VIEWS).forEach((k) => {
    if (k !== targetKey) consider(VIEWS[k].fn(heights));
  });
  consider(correct.slice().reverse()); // mirror image

  // fill any remainder with single-column height tweaks of the correct view
  let guard = 0;
  while (distractors.length < 3 && guard++ < 60) {
    const p = correct.slice();
    const i = rnd(p.length);
    p[i] = Math.max(0, p[i] + (rnd(2) ? 1 : -1));
    if (p.every((v) => v === 0)) continue;
    consider(p);
  }

  const options = [correct, ...distractors.slice(0, 3)];
  // shuffle, remembering where the correct one lands
  for (let i = options.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, correctIndex: options.findIndex((p) => profileKey(p) === cKey) };
}

// ---- isometric 3D rendering ----------------------------------------------
const TW = 34; // top-face diamond width
const TH = 17; // top-face diamond height (2:1 iso)
const CH = 22; // cube vertical height
const FACE = { top: "#c9a8f0", left: "#a274d6", right: "#7f4fbf", stroke: "#4c2d75" };

function project(gx, gy, gz) {
  return [(gx - gy) * (TW / 2), (gx + gy) * (TH / 2) - gz * CH];
}
const pts = (arr) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

function IsoStructure({ heights }) {
  const n = N(heights);
  const faces = [];
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const track = (arr) =>
    arr.forEach(([x, y]) => {
      if (x < bounds.minX) bounds.minX = x;
      if (x > bounds.maxX) bounds.maxX = x;
      if (y < bounds.minY) bounds.minY = y;
      if (y > bounds.maxY) bounds.maxY = y;
    });

  // painter's order: back cells (small x+y) first, bottom cubes first
  const cells = [];
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) cells.push([x, y]);
  cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));

  for (const [x, y] of cells) {
    const h = heights[x][y];
    for (let z = 0; z < h; z++) {
      const top = [project(x, y, z + 1), project(x + 1, y, z + 1), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)];
      const right = [project(x + 1, y, z), project(x + 1, y + 1, z), project(x + 1, y + 1, z + 1), project(x + 1, y, z + 1)];
      const left = [project(x, y + 1, z), project(x + 1, y + 1, z), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)];
      track(top);
      faces.push(<polygon key={`${x}-${y}-${z}-r`} points={pts(right)} fill={FACE.right} stroke={FACE.stroke} strokeWidth="0.6" strokeLinejoin="round" />);
      faces.push(<polygon key={`${x}-${y}-${z}-l`} points={pts(left)} fill={FACE.left} stroke={FACE.stroke} strokeWidth="0.6" strokeLinejoin="round" />);
      faces.push(<polygon key={`${x}-${y}-${z}-t`} points={pts(top)} fill={FACE.top} stroke={FACE.stroke} strokeWidth="0.6" strokeLinejoin="round" />);
    }
  }

  const pad = 8;
  const vb = `${bounds.minX - pad} ${bounds.minY - pad} ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`;
  return (
    <svg className="bb-iso" viewBox={vb} role="img" aria-label="3D block structure seen from the front">
      {faces}
      <text x={(bounds.minX + bounds.maxX) / 2} y={bounds.maxY + pad - 1} className="bb-facing" textAnchor="middle">
        FRONT
      </text>
    </svg>
  );
}

function Elevation({ grid }) {
  const rows = grid.length;
  const cols = grid[0].length;
  return (
    <div className="bb-elev" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
      {grid.flatMap((row, r) => row.map((v, c) => <span key={`${r}-${c}`} className={v ? "bb-cell on" : "bb-cell"} />))}
    </div>
  );
}

export default function BlockBuilder({ onBack, onFinish, best }) {
  const eng = useRef({ streak: 0, best: 0 });
  const [round, setRound] = useState(null); // { heights, targetKey, options, correctIndex, rows }
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState("play"); // play | result | summary
  const [summary, setSummary] = useState(null);
  const timer = useRef(null);

  function newRound() {
    clearTimeout(timer.current);
    const done = eng.current.streak;
    const n = done >= 5 ? 4 : 3; // grow the base once you're warmed up
    const hCap = Math.min(3 + Math.floor(done / 3), 5);
    const heights = makeStructure(n, hCap);
    const targetKey = Object.keys(VIEWS)[rnd(3)];
    const { options, correctIndex } = buildChoices(heights, targetKey);
    const rows = Math.max(maxH(heights), ...options.map((p) => Math.max(...p)));
    setRound({ heights, targetKey, options, correctIndex, rows });
    setPicked(null);
    setPhase("play");
  }

  function choose(i) {
    if (phase !== "play") return;
    setPicked(i);
    setPhase("result");
    const correct = i === round.correctIndex;
    if (correct) {
      eng.current.streak += 1;
      eng.current.best = Math.max(eng.current.best, eng.current.streak);
      timer.current = setTimeout(newRound, 1100);
    } else {
      timer.current = setTimeout(finish, 1900);
    }
  }

  function finish() {
    const achieved = eng.current.best;
    const xpEarned = 15 + achieved * 14;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ maxStreak: Math.max(prev.maxStreak, achieved), plays: prev.plays + 1 }),
    });
    setSummary({ achieved, xpEarned });
  }

  function start() {
    eng.current = { streak: 0, best: 0 };
    setSummary(null);
    newRound();
  }

  useEffect(() => {
    start();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grids = useMemo(() => (round ? round.options.map((p) => profileToGrid(p, round.rows)) : []), [round]);

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Block Builder" title="Block Builder" onBack={onBack}>
        <span className="stat-pill">
          Streak <b className="mono">{eng.current.streak}</b>
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.maxStreak}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={summary.achieved}
            detail={`views solved in a row, at your best · +${summary.xpEarned} xp to Hippocampus`}
            onAgain={start}
            againLabel="Try Again"
            onBack={onBack}
          />
        ) : (
          round && (
            <>
              <IsoStructure heights={round.heights} />
              <p className="stage-msg big">
                Which is the view from <b style={{ color: "var(--hippocampus)" }}>{VIEWS[round.targetKey].label}</b>?
              </p>
              <div className="bb-choices">
                {grids.map((grid, i) => {
                  let cls = "bb-choice";
                  if (phase === "result") {
                    if (i === round.correctIndex) cls += " correct";
                    else if (i === picked) cls += " wrong";
                  }
                  return (
                    <button key={i} className={cls} disabled={phase !== "play"} onClick={() => choose(i)}>
                      <Elevation grid={grid} />
                    </button>
                  );
                })}
              </div>
              {phase === "result" && <p className="stage-msg mono">{picked === round.correctIndex ? "correct — next structure" : "not that one — run over"}</p>}
            </>
          )
        )}
      </div>
    </>
  );
}
