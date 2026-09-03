import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { randomConsolation } from "../data/praise.js";
import { useNoScroll } from "../hooks/useNoScroll.js";

const N = 3; // 3x3 grid of places
const COUNT = N * N;
const DELIVERIES = 4;
const POINTS = 3;
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
const rc = (i) => [Math.floor(i / N), i % N];
const manhattan = (a, b) => { const [ra, ca] = rc(a); const [rb, cb] = rc(b); return Math.abs(ra - rb) + Math.abs(ca - cb); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Which place lies in `dir` from index i, or null if that's the edge (a wall).
function neighbor(i, dir) {
  let [r, c] = rc(i);
  if (dir === "up") r -= 1;
  else if (dir === "down") r += 1;
  else if (dir === "left") c -= 1;
  else if (dir === "right") c += 1;
  if (r < 0 || r >= N || c < 0 || c >= N) return null;
  return r * N + c;
}

// Does stepping `dir` from `at` move you closer to `to`? (allocentric bearing check)
function movesToward(at, to, dir) {
  const [ra, ca] = rc(at);
  const [rt, ct] = rc(to);
  if (dir === "up") return rt < ra;
  if (dir === "down") return rt > ra;
  if (dir === "left") return ct < ca;
  if (dir === "right") return ct > ca;
  return false;
}

// Hippocampus — allocentric wayfinding, the London-taxi "Knowledge" mechanism.
// You explore a landmark map with NO overview, build a cognitive map in your
// head, then navigate between landmarks from memory and finally call bearings
// ("which way is the Fountain from here?"). No minimap, no route arrow — that
// would push the task onto the caudate response system and away from the
// hippocampus. Orientation is fixed north-up so it stays a pure map task.
export default function Wayfinder({ onBack, onFinish, best }) {
  useNoScroll();
  const eng = useRef(null);
  const [phase, setPhase] = useState("explore"); // explore | deliver | point | summary
  const [pos, setPos] = useState(0);
  const [found, setFound] = useState(1);
  const [task, setTask] = useState(null); // { to } during deliver, { at, to } during point
  const [msg, setMsg] = useState("");
  const [flash, setFlash] = useState(null); // ok | bad | wall
  const [summary, setSummary] = useState(null);
  const flashTimer = useRef(null);

  function doFlash(kind) {
    setFlash(kind);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 320);
  }

  function start() {
    const grid = shuffle(LANDMARKS).slice(0, COUNT).map(([emoji, name]) => ({ emoji, name }));
    const startPos = rnd(COUNT);
    // deliveries: distinct from/to, at least 2 apart so the route is non-trivial
    const deliveries = [];
    while (deliveries.length < DELIVERIES) {
      const from = rnd(COUNT);
      const to = rnd(COUNT);
      if (manhattan(from, to) >= 2) deliveries.push({ from, to });
    }
    // bearing probes: distinct at/to
    const points = [];
    while (points.length < POINTS) {
      const at = rnd(COUNT);
      const to = rnd(COUNT);
      if (at !== to) points.push({ at, to });
    }
    eng.current = {
      grid, pos: startPos, visited: new Set([startPos]),
      deliveries, dIdx: 0, moves: 0, mDist: 0, routeScores: [],
      points, pIdx: 0, pCorrect: 0, busy: false,
    };
    setSummary(null);
    setPhase("explore");
    setPos(startPos);
    setFound(1);
    setTask(null);
    setFlash(null);
    setMsg("explore every place — no map will be shown, so build one in your head");
  }

  function beginDeliveries() {
    const e = eng.current;
    e.dIdx = 0;
    setPhase("deliver");
    loadDelivery(0);
  }

  function loadDelivery(k) {
    const e = eng.current;
    const d = e.deliveries[k];
    e.pos = d.from;
    e.moves = 0;
    e.mDist = manhattan(d.from, d.to);
    e.busy = false;
    setPos(d.from);
    setTask({ to: d.to });
    setMsg(`delivery ${k + 1}/${DELIVERIES} — get to the ${e.grid[d.to].name} ${e.grid[d.to].emoji}`);
  }

  function completeDelivery() {
    const e = eng.current;
    e.busy = true; // ignore input during the between-round pause
    e.routeScores.push(clamp(e.mDist / Math.max(e.moves, e.mDist), 0, 1));
    doFlash("ok");
    e.dIdx += 1;
    if (e.dIdx >= DELIVERIES) beginPointing();
    else setTimeout(() => loadDelivery(e.dIdx), 500);
  }

  function beginPointing() {
    const e = eng.current;
    e.pIdx = 0;
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
    setMsg(`bearing ${k + 1}/${POINTS} — which way to the ${e.grid[p.to].name} ${e.grid[p.to].emoji}?`);
  }

  function move(dir) {
    const e = eng.current;
    const nb = neighbor(e.pos, dir);
    if (nb == null) { doFlash("wall"); return; }
    e.pos = nb;
    setPos(nb);
    if (phaseRef.current === "explore") {
      if (!e.visited.has(nb)) {
        e.visited.add(nb);
        setFound(e.visited.size);
        if (e.visited.size >= COUNT) setMsg("every place found — ready when you are");
      }
    } else if (phaseRef.current === "deliver") {
      e.moves += 1;
      if (nb === e.deliveries[e.dIdx].to) completeDelivery();
    }
  }

  function answerPoint(dir) {
    const e = eng.current;
    e.busy = true; // one answer per probe; ignore input until the next loads
    const p = e.points[e.pIdx];
    const ok = movesToward(p.at, p.to, dir);
    if (ok) e.pCorrect += 1;
    doFlash(ok ? "ok" : "bad");
    e.pIdx += 1;
    if (e.pIdx >= POINTS) setTimeout(finish, 500);
    else setTimeout(() => loadPoint(e.pIdx), 550);
  }

  function onKey(ev) {
    const dir = KEYMAP[ev.key];
    if (!dir) return;
    ev.preventDefault();
    if (ev.repeat) return;
    act(dir);
  }

  // route to the right handler for the current phase (read live phase from state)
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  function act(dir) {
    if (!eng.current || eng.current.busy) return;
    const ph = phaseRef.current;
    if (ph === "explore" || ph === "deliver") move(dir);
    else if (ph === "point") answerPoint(dir);
  }

  function finish() {
    const e = eng.current;
    const routeAvg = e.routeScores.length ? e.routeScores.reduce((s, v) => s + v, 0) / e.routeScores.length : 0;
    const pointAcc = e.pCorrect / POINTS;
    const scoreVal = Math.round((0.7 * routeAvg + 0.3 * pointAcc) * 100);
    const prevBest = best.bestScore;
    const isBest = scoreVal > 0 && scoreVal > prevBest;
    const xpEarned = 20 + scoreVal;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ bestScore: Math.max(prev.bestScore, scoreVal), plays: prev.plays + 1 }),
    });
    setSummary({ scoreVal, routePct: Math.round(routeAvg * 100), pCorrect: e.pCorrect, xpEarned, isBest, bestShown: Math.max(prevBest, scoreVal) });
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

  const grid = eng.current?.grid;
  const here = grid?.[pos];
  const isPoint = phase === "point";
  // during explore/deliver a direction is a door only if a place lies that way;
  // during pointing all four are bearing choices.
  const doorOpen = (dir) => (isPoint ? true : neighbor(pos, dir) != null);

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Wayfinder" title="Wayfinder" onBack={onBack}>
        <span className="stat-pill">
          Best <b className="mono">{best.bestScore}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            praise={summary.isBest ? "New personal best! 🏆" : undefined}
            eyebrow={summary.isBest ? "new high score!" : "route complete"}
            bigNum={summary.scoreVal}
            detail={`navigation score · ${summary.routePct}% route-efficient · ${summary.pCorrect}/${POINTS} bearings right · best ${summary.bestShown} · +${summary.xpEarned} xp to Hippocampus`}
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
                {phase === "explore" && <span className="wf-here-sub mono">found {found}/{COUNT}</span>}
                {phase === "deliver" && task && <span className="wf-here-sub">→ {grid[task.to].emoji} {grid[task.to].name}</span>}
                {isPoint && task && <span className="wf-here-sub">point to {grid[task.to].emoji}</span>}
              </div>
            </div>

            {phase === "explore" &&
              (found >= COUNT ? (
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
