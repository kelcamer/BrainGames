import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { useNoScroll } from "../hooks/useNoScroll.js";

// Difficulty ladder — grid grows as you prove yourself, so the first runs are
// gentle and the map load ramps up only once you can handle it.
const LADDER = [
  [1, 2], [2, 2], [2, 3], [3, 3], [3, 4], [4, 4],
];
const PASS = 85; // navigation score that unlocks the next map size
const KEYMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
const ARROWS = { up: "↑", right: "→", down: "↓", left: "←" };
const DIRS = ["up", "right", "down", "left"];

const LANDMARKS = [
  ["🌳", "Park"], ["⛲", "Fountain"], ["🏰", "Castle"], ["🗼", "Tower"],
  ["⛪", "Church"], ["🏛️", "Museum"], ["🎡", "Wheel"], ["⚓", "Docks"],
  ["🌉", "Bridge"], ["🏥", "Hospital"], ["🎪", "Circus"], ["🏟️", "Stadium"],
  ["🎢", "Coaster"], ["🕌", "Mosque"], ["🏭", "Factory"], ["🗿", "Statue"],
];

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rc = (i, cols) => [Math.floor(i / cols), i % cols];
const manhattan = (a, b, cols) => { const [ra, ca] = rc(a, cols); const [rb, cb] = rc(b, cols); return Math.abs(ra - rb) + Math.abs(ca - cb); };

// Which place lies in `dir` from index i, or null if that's the edge (a wall).
function neighbor(i, dir, rows, cols) {
  let [r, c] = rc(i, cols);
  if (dir === "up") r -= 1;
  else if (dir === "down") r += 1;
  else if (dir === "left") c -= 1;
  else if (dir === "right") c += 1;
  if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
  return r * cols + c;
}

// Does stepping `dir` from `at` move you closer to `to`? (allocentric bearing check)
function movesToward(at, to, dir, cols) {
  const [ra, ca] = rc(at, cols);
  const [rt, ct] = rc(to, cols);
  if (dir === "up") return rt < ra;
  if (dir === "down") return rt > ra;
  if (dir === "left") return ct < ca;
  if (dir === "right") return ct > ca;
  return false;
}

// Hippocampus — allocentric wayfinding, the London-taxi "Knowledge" mechanism.
// Explore a landmark map with NO overview, build a cognitive map in your head,
// then navigate between landmarks from memory and call bearings. No minimap, no
// route arrow — that would push the task onto the caudate response system.
// Orientation is fixed north-up so it stays a pure map task. The grid starts
// tiny (1x2) and climbs the ladder as you clear runs.
export default function Wayfinder({ onBack, onFinish, best }) {
  useNoScroll();
  const eng = useRef(null);
  const [phase, setPhase] = useState("explore"); // explore | deliver | point | summary
  const [pos, setPos] = useState(0);
  const [found, setFound] = useState(1);
  const [task, setTask] = useState(null);
  const [msg, setMsg] = useState("");
  const [flash, setFlash] = useState(null); // ok | bad | wall
  const [summary, setSummary] = useState(null);
  const flashTimer = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  function doFlash(kind) {
    setFlash(kind);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 320);
  }

  function start() {
    const level = clamp(best.level ?? 0, 0, LADDER.length - 1);
    const [rows, cols] = LADDER[level];
    const count = rows * cols;
    const grid = shuffle(LANDMARKS).slice(0, count).map(([emoji, name]) => ({ emoji, name }));
    const startPos = rnd(count);
    const nDeliveries = clamp(Math.round(count * 0.6), 2, 5);
    const nPoints = clamp(Math.round(count / 3), 1, 3);
    const minDist = count <= 4 ? 1 : 2; // tiny maps can't offer far pairs

    const deliveries = [];
    let guard = 0;
    while (deliveries.length < nDeliveries && guard++ < 500) {
      const from = rnd(count);
      const to = rnd(count);
      if (from !== to && manhattan(from, to, cols) >= minDist) deliveries.push({ from, to });
    }
    const points = [];
    guard = 0;
    while (points.length < nPoints && guard++ < 500) {
      const at = rnd(count);
      const to = rnd(count);
      if (at !== to) points.push({ at, to });
    }

    eng.current = {
      level, rows, cols, count, grid, pos: startPos, visited: new Set([startPos]),
      deliveries, dIdx: 0, moves: 0, mDist: 0, routeScores: [],
      points, pIdx: 0, pCorrect: 0, busy: false,
    };
    setSummary(null);
    setPhase("explore");
    setPos(startPos);
    setFound(1);
    setTask(null);
    setFlash(null);
    setMsg(`explore all ${count} places — no map will be shown, so build one in your head`);
  }

  function beginDeliveries() {
    eng.current.dIdx = 0;
    setPhase("deliver");
    loadDelivery(0);
  }

  function loadDelivery(k) {
    const e = eng.current;
    const d = e.deliveries[k];
    e.pos = d.from;
    e.moves = 0;
    e.mDist = manhattan(d.from, d.to, e.cols);
    e.busy = false;
    setPos(d.from);
    setTask({ to: d.to });
    setMsg(`delivery ${k + 1}/${e.deliveries.length} — get to the ${e.grid[d.to].name} ${e.grid[d.to].emoji}`);
  }

  function completeDelivery() {
    const e = eng.current;
    e.busy = true;
    e.routeScores.push(clamp(e.mDist / Math.max(e.moves, e.mDist), 0, 1));
    doFlash("ok");
    e.dIdx += 1;
    if (e.dIdx >= e.deliveries.length) beginPointing();
    else setTimeout(() => loadDelivery(e.dIdx), 500);
  }

  function beginPointing() {
    eng.current.pIdx = 0;
    setPhase("point");
    loadPoint(0);
  }

  function loadPoint(k) {
    const e = eng.current;
    const p = e.points[k];
    e.pos = p.at;
    e.busy = false;
    setPos(p.at);
    setTask({ at: p.at, to: p.to });
    setMsg(`bearing ${k + 1}/${e.points.length} — which way to the ${e.grid[p.to].name} ${e.grid[p.to].emoji}?`);
  }

  function move(dir) {
    const e = eng.current;
    const nb = neighbor(e.pos, dir, e.rows, e.cols);
    if (nb == null) { doFlash("wall"); return; }
    e.pos = nb;
    setPos(nb);
    if (phaseRef.current === "explore") {
      if (!e.visited.has(nb)) {
        e.visited.add(nb);
        setFound(e.visited.size);
        if (e.visited.size >= e.count) setMsg("every place found — ready when you are");
      }
    } else if (phaseRef.current === "deliver") {
      e.moves += 1;
      if (nb === e.deliveries[e.dIdx].to) completeDelivery();
    }
  }

  function answerPoint(dir) {
    const e = eng.current;
    e.busy = true;
    const p = e.points[e.pIdx];
    const ok = movesToward(p.at, p.to, dir, e.cols);
    if (ok) e.pCorrect += 1;
    doFlash(ok ? "ok" : "bad");
    e.pIdx += 1;
    if (e.pIdx >= e.points.length) setTimeout(finish, 500);
    else setTimeout(() => loadPoint(e.pIdx), 550);
  }

  function act(dir) {
    if (!eng.current || eng.current.busy) return;
    const ph = phaseRef.current;
    if (ph === "explore" || ph === "deliver") move(dir);
    else if (ph === "point") answerPoint(dir);
  }

  function onKey(ev) {
    const dir = KEYMAP[ev.key];
    if (!dir) return;
    ev.preventDefault();
    if (ev.repeat) return;
    act(dir);
  }

  function finish() {
    const e = eng.current;
    const routeAvg = e.routeScores.length ? e.routeScores.reduce((s, v) => s + v, 0) / e.routeScores.length : 0;
    const pointAcc = e.points.length ? e.pCorrect / e.points.length : 0;
    const scoreVal = Math.round((0.7 * routeAvg + 0.3 * pointAcc) * 100);
    const maxLevel = LADDER.length - 1;
    const advanced = scoreVal >= PASS && e.level < maxLevel;
    const newLevel = advanced ? e.level + 1 : e.level;
    const prevBest = best.bestScore;
    const isBest = scoreVal > 0 && scoreVal > prevBest;
    const xpEarned = 20 + scoreVal;
    const [nr, nc] = LADDER[newLevel];
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        bestScore: Math.max(prev.bestScore, scoreVal),
        level: Math.max(prev.level ?? 0, newLevel),
        plays: prev.plays + 1,
      }),
    });
    setSummary({
      scoreVal, routePct: Math.round(routeAvg * 100), pCorrect: e.pCorrect, nPoints: e.points.length,
      rows: e.rows, cols: e.cols, xpEarned, isBest, bestShown: Math.max(prevBest, scoreVal),
      advanced, nextSize: `${nr}×${nc}`,
    });
    setPhase("summary");
  }

  useEffect(() => {
    start();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(flashTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const g = eng.current;
  const grid = g?.grid;
  const here = grid?.[pos];
  const isPoint = phase === "point";
  const doorOpen = (dir) => (isPoint ? true : g ? neighbor(pos, dir, g.rows, g.cols) != null : false);

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Wayfinder" title="Wayfinder" onBack={onBack}>
        <span className="stat-pill">
          Map <b className="mono">{g ? `${g.rows}×${g.cols}` : "—"}</b>
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.bestScore}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            praise={summary.advanced ? `Unlocked the ${summary.nextSize} map! 🗺️` : summary.isBest ? "New personal best! 🏆" : undefined}
            eyebrow={summary.advanced ? "level up!" : summary.isBest ? "new high score!" : "route complete"}
            bigNum={summary.scoreVal}
            detail={`navigation score on the ${summary.rows}×${summary.cols} map · ${summary.routePct}% route-efficient · ${summary.pCorrect}/${summary.nPoints} bearings right${summary.advanced ? ` · next map ${summary.nextSize}` : ` · reach ${PASS} to grow the map`} · +${summary.xpEarned} xp`}
            onAgain={start}
            againLabel="New City"
            onBack={onBack}
          />
        ) : (
          <>
            <p className="stage-msg">{msg}</p>
            <div className={"wf-cross" + (flash ? ` wf-${flash}` : "")}>
              {DIRS.map((dir) => {
                const open = doorOpen(dir);
                return (
                  <button
                    key={dir}
                    className={`wf-door ${dir}` + (open ? "" : " wf-closed")}
                    disabled={!open}
                    onPointerDown={(ev) => { ev.preventDefault(); act(dir); }}
                    aria-label={dir}
                  >
                    {open ? ARROWS[dir] : ""}
                  </button>
                );
              })}
              <div className="wf-here">
                <span className="wf-here-emoji">{here?.emoji}</span>
                <span className="wf-here-name">{here?.name}</span>
                {phase === "explore" && g && <span className="wf-here-sub mono">found {found}/{g.count}</span>}
                {phase === "deliver" && task && <span className="wf-here-sub">Go to {grid[task.to].emoji} {grid[task.to].name}</span>}
                {isPoint && task && <span className="wf-here-sub">point to {grid[task.to].emoji}</span>}
              </div>
            </div>

            {phase === "explore" &&
              (g && found >= g.count ? (
                <button className="btn btn--primary" onClick={beginDeliveries}>
                  Start deliveries
                </button>
              ) : (
                <p className="stage-msg mono">move with ← ↑ → ↓ or tap the doors</p>
              ))}
            {phase === "deliver" && <p className="stage-msg mono">navigate from memory — no map</p>}
            {isPoint && <p className="stage-msg mono">press the direction, don't walk there</p>}
          </>
        )}
      </div>
    </>
  );
}
