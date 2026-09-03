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

// One shortest (L-shaped) route from `from` to `to` — used to show a "best"
// route next to the player's own when they took a detour.
function optimalPath(from, to, cols) {
  let [r, c] = rc(from, cols);
  const [tr, tc] = rc(to, cols);
  const path = [from];
  while (r !== tr) { r += r < tr ? 1 : -1; path.push(r * cols + c); }
  while (c !== tc) { c += c < tc ? 1 : -1; path.push(r * cols + c); }
  return path;
}

// The exact 8-way compass bearing from `at` to `to` (e.g. "N", "SE"). Bearing
// probes only ever use places that lie on a clean 8-way ray, so this is always
// one unambiguous answer.
function bearing8(at, to, cols) {
  const [ra, ca] = rc(at, cols);
  const [rt, ct] = rc(to, cols);
  const dr = rt - ra, dc = ct - ca;
  return (dr < 0 ? "N" : dr > 0 ? "S" : "") + (dc < 0 ? "W" : dc > 0 ? "E" : "");
}

const CARD_TO_8 = { up: "N", down: "S", left: "W", right: "E" };
const COMPASS = [
  { code: "NW", glyph: "↖", area: "nw" }, { code: "N", glyph: "↑", area: "n" }, { code: "NE", glyph: "↗", area: "ne" },
  { code: "W", glyph: "←", area: "w" }, { code: "E", glyph: "→", area: "e" },
  { code: "SW", glyph: "↙", area: "sw" }, { code: "S", glyph: "↓", area: "s" }, { code: "SE", glyph: "↘", area: "se" },
];

// The review map: the whole city (every landmark in its real position) with the
// route you actually walked drawn on top, plus the shortest route dashed.
function WayMap({ rows, cols, cells, yourIdx, bestIdx, from, to }) {
  const cell = 44;
  const w = cols * cell;
  const h = rows * cell;
  const cx = (i) => ((i % cols) + 0.5) * cell;
  const cy = (i) => (Math.floor(i / cols) + 0.5) * cell;
  const poly = (idxs) => idxs.map((i) => `${cx(i)},${cy(i)}`).join(" ");
  const badge = (i, cls, label) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    return (
      <g>
        <circle cx={x + 11} cy={y + 11} r="8" className={cls} />
        <text x={x + 11} y={y + 11} className="wf-badge-text" textAnchor="middle" dominantBaseline="central" fontSize="10">{label}</text>
      </g>
    );
  };
  return (
    <svg className="wf-map" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="route map">
      {cells.map((emoji, i) => {
        const cls = "wf-map-cell" + (i === from ? " wf-map-cell-start" : "") + (i === to ? " wf-map-cell-goal" : "");
        return (
          <g key={i}>
            <rect x={(i % cols) * cell + 2} y={Math.floor(i / cols) * cell + 2} width={cell - 4} height={cell - 4} rx="7" className={cls} />
            <text x={cx(i)} y={cy(i)} className="wf-map-emoji" textAnchor="middle" dominantBaseline="central" fontSize={cell * 0.5}>{emoji}</text>
          </g>
        );
      })}
      <polyline points={poly(bestIdx)} className="wf-map-best" fill="none" />
      <polyline points={poly(yourIdx)} className="wf-map-you" fill="none" />
      {badge(from, "wf-badge-start", "S")}
      {badge(to, "wf-badge-goal", "G")}
    </svg>
  );
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
  const [phase, setPhase] = useState("select"); // select | explore | study | deliver | point | summary
  const [pos, setPos] = useState(0);
  const [found, setFound] = useState(1);
  const [task, setTask] = useState(null);
  const [msg, setMsg] = useState("");
  const [flash, setFlash] = useState(null); // ok | bad | wall
  const [summary, setSummary] = useState(null);
  const flashTimer = useRef(null);
  const lastCity = useRef(null); // { level, grid } of the most recent run, for "replay same city"
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  function doFlash(kind) {
    setFlash(kind);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 320);
  }

  // Entry point (also "New City"): pick a size first.
  function start() {
    setSummary(null);
    setPhase("select");
  }

  function chooseSize(level) {
    buildRun(level, null);
  }

  // Rebuild the same city (same landmark layout), but with fresh deliveries and
  // bearing probes — re-study and re-test the map you're trying to learn.
  function replaySameCity() {
    const lc = lastCity.current;
    if (lc) buildRun(lc.level, lc.grid);
    else start();
  }

  function buildRun(level, presetGrid) {
    const [rows, cols] = LADDER[level];
    const count = rows * cols;
    const grid = presetGrid || shuffle(LANDMARKS).slice(0, count).map(([emoji, name]) => ({ emoji, name }));
    lastCity.current = { level, grid };
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
      const [ra, ca] = rc(at, cols);
      // only targets on a clean 8-way ray from `at`, so the compass answer is exact
      const aligned = [];
      for (let j = 0; j < count; j++) {
        if (j === at) continue;
        const [rj, cj] = rc(j, cols);
        const dr = rj - ra, dc = cj - ca;
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) aligned.push(j);
      }
      if (aligned.length) points.push({ at, to: aligned[rnd(aligned.length)] });
    }

    eng.current = {
      level, rows, cols, count, grid, pos: startPos, visited: new Set([startPos]),
      deliveries, dIdx: 0, moves: 0, mDist: 0, routeScores: [], path: [], deliveryRecords: [],
      points, pIdx: 0, pCorrect: 0, busy: false,
    };
    setSummary(null);
    setPos(startPos);
    setFound(1);
    setTask(null);
    setFlash(null);
    beginStudy();
  }

  function beginStudy() {
    setMsg("study the map as long as you like — press Continue when you've got it, then it's gone");
    setPhase("study");
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
    e.path = [d.from];
    e.busy = false;
    setPos(d.from);
    setTask({ to: d.to });
    setMsg(`delivery ${k + 1}/${e.deliveries.length} — get to the ${e.grid[d.to].name} ${e.grid[d.to].emoji}`);
  }

  function completeDelivery() {
    const e = eng.current;
    e.busy = true;
    const d = e.deliveries[e.dIdx];
    e.deliveryRecords.push({ from: d.from, to: d.to, path: e.path.slice(), moves: e.moves, mDist: e.mDist });
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
    if (phaseRef.current === "deliver") {
      e.moves += 1;
      e.path.push(nb);
      if (nb === e.deliveries[e.dIdx].to) completeDelivery();
    }
  }

  function answerPoint(code) {
    const e = eng.current;
    if (!e || e.busy) return;
    e.busy = true;
    const p = e.points[e.pIdx];
    const ok = code === bearing8(p.at, p.to, e.cols);
    if (ok) e.pCorrect += 1;
    doFlash(ok ? "ok" : "bad");
    e.pIdx += 1;
    if (e.pIdx >= e.points.length) setTimeout(finish, 500);
    else setTimeout(() => loadPoint(e.pIdx), 550);
  }

  // Movement doors / keyboard arrows. In the bearing phase a keyboard arrow is a
  // cardinal compass answer; diagonals are tapped on the compass.
  function act(dir) {
    if (!eng.current || eng.current.busy) return;
    const ph = phaseRef.current;
    if (ph === "explore" || ph === "deliver") move(dir);
    else if (ph === "point") answerPoint(CARD_TO_8[dir]);
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
    const cleared = scoreVal >= PASS;
    const prevBest = best.bestScore;
    const isBest = scoreVal > 0 && scoreVal > prevBest;
    const xpEarned = 20 + scoreVal;
    // routes where you didn't take the shortest path — shown on a map of the
    // city (which you never saw while navigating) with your path drawn on it
    const routes = e.deliveryRecords
      .filter((r) => r.moves > r.mDist)
      .map((r) => ({
        fromEmoji: e.grid[r.from].emoji,
        fromName: e.grid[r.from].name,
        toEmoji: e.grid[r.to].emoji,
        toName: e.grid[r.to].name,
        moves: r.moves,
        mDist: r.mDist,
        rows: e.rows,
        cols: e.cols,
        cells: e.grid.map((g) => g.emoji),
        yourIdx: r.path.slice(),
        bestIdx: optimalPath(r.from, r.to, e.cols),
        from: r.from,
        to: r.to,
      }));
    // how often your very first step headed away from the goal (the 180° tell)
    let firstAway = 0;
    e.deliveryRecords.forEach((r) => {
      if (r.path.length >= 2 && manhattan(r.path[1], r.to, e.cols) > manhattan(r.from, r.to, e.cols)) firstAway += 1;
    });
    const totalDeliveries = e.deliveryRecords.length;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        bestScore: Math.max(prev.bestScore, scoreVal),
        level: cleared ? Math.max(prev.level ?? 0, e.level) : prev.level ?? 0,
        plays: prev.plays + 1,
      }),
    });
    setSummary({
      scoreVal, routePct: Math.round(routeAvg * 100), pCorrect: e.pCorrect, nPoints: e.points.length,
      rows: e.rows, cols: e.cols, xpEarned, isBest, bestShown: Math.max(prevBest, scoreVal),
      cleared, routes, firstAway, totalDeliveries,
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
            praise={summary.cleared ? `Cleared the ${summary.rows}×${summary.cols} map! ⭐` : summary.isBest ? "New personal best! 🏆" : undefined}
            eyebrow={summary.cleared ? "cleared!" : summary.isBest ? "new high score!" : "route complete"}
            bigNum={summary.scoreVal}
            detail={`navigation score on the ${summary.rows}×${summary.cols} map · ${summary.routePct}% route-efficient · ${summary.pCorrect}/${summary.nPoints} bearings right · best ${summary.bestShown} · +${summary.xpEarned} xp`}
            onAgain={start}
            againLabel="New City"
            onBack={onBack}
          >
            <p className={"wf-firststat" + (summary.firstAway > 0 ? " wf-firststat--hit" : "")}>
              first move <b>away</b> from the goal · <b>{summary.firstAway}/{summary.totalDeliveries}</b>
              {summary.firstAway > 0 ? " — pause and check the bearing first" : " — nice, you set off the right way every time"}
            </p>
            {summary.routes.length > 0 && (
              <div className="wf-routes">
                <div className="wf-routes-title">the map you couldn't see — and where you went</div>
                {summary.routes.map((r, i) => (
                  <div className="wf-route" key={i}>
                    <div className="wf-route-head">
                      start <b>{r.fromEmoji} {r.fromName}</b> → goal <b>{r.toEmoji} {r.toName}</b> · you took {r.moves}, best {r.mDist}
                    </div>
                    <WayMap {...r} />
                    <div className="wf-map-legend">
                      <span className="wf-lg wf-lg-you">your route</span>
                      <span className="wf-lg wf-lg-best">shortest</span>
                      <span className="wf-lg wf-lg-start">S = start</span>
                      <span className="wf-lg wf-lg-end">G = goal</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SessionSummary>
        ) : phase === "select" ? (
          <div className="wf-select">
            {lastCity.current && (
              <button className="btn btn--primary wf-replay-btn" onClick={replaySameCity}>
                ↺ Replay last city ({LADDER[lastCity.current.level][0]}×{LADDER[lastCity.current.level][1]}) — re-study & retest
              </button>
            )}
            <p className="stage-msg">{lastCity.current ? "…or start a new city" : "choose your city size"}</p>
            <div className="wf-size-grid">
              {LADDER.map(([r, c], lvl) => (
                <button key={lvl} className="btn wf-size-btn" onClick={() => chooseSize(lvl)}>
                  <b className="mono">{r}×{c}</b>
                  <span>{r * c} places</span>
                </button>
              ))}
            </div>
            <p className="stage-msg mono">no map is shown while you navigate — bigger is harder</p>
          </div>
        ) : phase === "study" ? (
          <div className="wf-study-wrap">
            <p className="stage-msg">{msg}</p>
            <div className="wf-study" style={{ gridTemplateColumns: `repeat(${g.cols}, 1fr)` }}>
              {g.grid.map((p, i) => (
                <div className="wf-study-cell" key={i}>
                  <span className="wf-study-emoji">{p.emoji}</span>
                  <span className="wf-study-name">{p.name}</span>
                </div>
              ))}
            </div>
            <div className="wf-study-foot">
              <button className="btn btn--primary" onClick={beginDeliveries}>
                Continue
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="stage-msg">{msg}</p>
            {isPoint ? (
              <div className={"wf-compass" + (flash ? ` wf-${flash}` : "")}>
                {COMPASS.map((c) => (
                  <button
                    key={c.code}
                    className={`wf-comp ${c.area}`}
                    onPointerDown={(ev) => { ev.preventDefault(); answerPoint(c.code); }}
                    aria-label={c.code}
                  >
                    {c.glyph}
                  </button>
                ))}
                <div className="wf-here">
                  <span className="wf-here-emoji">{here?.emoji}</span>
                  <span className="wf-here-name">{here?.name}</span>
                  {task && <span className="wf-here-sub">point to {grid[task.to].emoji} {grid[task.to].name}</span>}
                </div>
              </div>
            ) : (
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
                  {phase === "deliver" && task && <span className="wf-here-sub">Go to {grid[task.to].emoji} {grid[task.to].name}</span>}
                </div>
              </div>
            )}

            {phase === "deliver" && <p className="stage-msg mono">navigate from memory — no map · ← ↑ → ↓ or tap</p>}
            {isPoint && <p className="stage-msg mono">tap the compass direction to the target (8 ways)</p>}
          </>
        )}
      </div>
    </>
  );
}
