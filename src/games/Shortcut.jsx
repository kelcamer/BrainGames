import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { generateShortcutMaze, getCellWalls, isOpen } from "../utils/maze.js";

const TOTAL_ROUNDS = 4;
// Bigger than the original 4x4-6x5 range on purpose: in a small grid every
// route looks like "just go there," so the trained path reads as arbitrary
// instead of a real maze constraint, and the shortest path is trivial to
// eyeball once the map's revealed. More cells makes both the walls and the
// shortcut feel earned.
const SIZES = [
  [6, 6],
  [7, 6],
  [7, 7],
  [8, 7],
];

function adjacent(a, b, cols) {
  const ar = Math.floor(a / cols), ac = a % cols;
  const br = Math.floor(b / cols), bc = b % cols;
  return (ar === br && Math.abs(ac - bc) === 1) || (ac === bc && Math.abs(ar - br) === 1);
}

// Hippocampus — route learning vs. cognitive-map building (Iaria et al.'s
// spatial-vs-response-learner paradigm). You're only ever shown one route
// through a maze. Then the whole map is revealed and you're asked to reach
// the goal again: retrace the route you memorized, or notice the shortcut
// you were never shown? Only a genuine allocentric map lets you find it.
export default function Shortcut({ onBack, onFinish }) {
  const eng = useRef({ round: 0, maze: null, shortcutsFound: 0, xpAccum: 0 });
  const timers = useRef([]);
  const [uiRound, setUiRound] = useState(0);
  const [phase, setPhase] = useState("learn"); // learn | ready | test | result | summary
  const [revealed, setRevealed] = useState([]);
  const [currentPos, setCurrentPos] = useState(0);
  const [userPath, setUserPath] = useState([]);
  const [msg, setMsg] = useState("watch closely — this is the only route you'll be shown");
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function playWalkthrough(onDone) {
    const path = eng.current.maze.trainedPath;
    // Bigger mazes mean longer trained paths (20-50+ cells) — keep total watch
    // time roughly constant instead of letting it stretch past 20+ seconds.
    const stepMs = Math.max(110, Math.min(480, 7000 / path.length));
    let i = 0;
    function step() {
      if (i >= path.length) {
        timers.current.push(setTimeout(onDone, 500));
        return;
      }
      const cellIdx = path[i];
      setRevealed((prev) => {
        const next = prev.slice();
        next[cellIdx] = true;
        return next;
      });
      setCurrentPos(cellIdx);
      i++;
      timers.current.push(setTimeout(step, stepMs));
    }
    step();
  }

  function watchAgain() {
    clearTimers();
    setPhase("learn");
    setMsg("watch again…");
    setCurrentPos(eng.current.maze.start);
    playWalkthrough(() => {
      setPhase("ready");
      setMsg("that's the one path you were taught — is it actually the fastest way?");
    });
  }

  function nextRound() {
    clearTimers();
    const e = eng.current;
    if (e.round >= TOTAL_ROUNDS) return finish();
    const [rows, cols] = SIZES[e.round];
    e.round++;
    setUiRound(e.round);
    const maze = generateShortcutMaze(rows, cols);
    e.maze = maze;
    e.finished = false;
    setRevealed(new Array(rows * cols).fill(false));
    setCurrentPos(maze.start);
    setUserPath([maze.start]);
    setResult(null);
    setPhase("learn");
    setMsg("watch closely — this is the only route you'll be shown");
    playWalkthrough(() => {
      setPhase("ready");
      setMsg("that's the one path you were taught — is it actually the fastest way?");
    });
  }

  function startTest() {
    const e = eng.current;
    const { start } = e.maze;
    clearTimers();
    // Deliberately NOT revealing the map here. Showing the whole solved
    // layout turns this into "can you read a diagram," which any sighted
    // person does trivially — it stops testing whether you built a real
    // spatial model and starts testing visual search instead. You still see
    // whatever you already walked during training; anything past that is
    // fog until you actually step into it, same as real navigation.
    setCurrentPos(start);
    setUserPath([start]);
    setPhase("test");
    setMsg("no map this time — retrace what you know, or risk the unknown for a shortcut");
  }

  function moveTo(i) {
    const e = eng.current;
    const { cols, walls, goal } = e.maze;
    if (phase !== "test" || e.finished) return;
    if (!adjacent(currentPos, i, cols) || !isOpen(walls, cols, currentPos, i)) return;
    setCurrentPos(i);
    setRevealed((prev) => {
      const next = prev.slice();
      next[i] = true; // stepping into a cell is the only way to learn its walls
      return next;
    });
    setUserPath((prev) => {
      const next = [...prev, i];
      if (i === goal) {
        e.finished = true; // lock out further moves immediately — a fast double-click shouldn't sneak in an extra step before the result locks in
        timers.current.push(setTimeout(() => computeResult(next), 200));
      }
      return next;
    });
  }

  function computeResult(path) {
    const e = eng.current;
    const { trainedPath, optimalPath } = e.maze;
    const userLen = path.length - 1;
    const trainedLen = trainedPath.length - 1;
    const optimalLen = optimalPath.length - 1;
    let kind, xp;
    if (userLen <= optimalLen && optimalLen < trainedLen) {
      kind = "mapped";
      xp = 15 + 25;
      e.shortcutsFound++;
    } else if (userLen <= trainedLen) {
      kind = "retraced";
      xp = 15 + 10;
    } else {
      kind = "explored";
      xp = 15 + 5;
    }
    e.xpAccum += xp;
    setResult({ kind, userLen, trainedLen, optimalLen });
    setPhase("result");
    setMsg("");
    timers.current.push(setTimeout(nextRound, 2200));
  }

  function finish() {
    const e = eng.current;
    onFinish({
      xpEarned: e.xpAccum,
      updateBest: (prev) => ({
        shortcutsFound: Math.max(prev.shortcutsFound, e.shortcutsFound),
        plays: prev.plays + 1,
      }),
    });
    setSummary({ shortcutsFound: e.shortcutsFound, xpEarned: e.xpAccum });
  }

  function start() {
    eng.current = { round: 0, maze: null, shortcutsFound: 0, xpAccum: 0 };
    setUiRound(0);
    setSummary(null);
    nextRound();
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maze = eng.current.maze;

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Shortcut" title="Shortcut" onBack={onBack}>
        <span className="stat-pill">
          Round{" "}
          <b className="mono">
            {uiRound}/{TOTAL_ROUNDS}
          </b>
        </span>
        <span className="stat-pill">
          Shortcuts found <b className="mono">{eng.current.shortcutsFound}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={summary.shortcutsFound}
            detail={`shortcuts found out of ${TOTAL_ROUNDS} mazes · +${summary.xpEarned} xp to Hippocampus`}
            onAgain={start}
            onBack={onBack}
          />
        ) : maze ? (
          <>
            <div
              className="maze-grid"
              style={{ gridTemplateColumns: `repeat(${maze.cols}, 44px)`, gridTemplateRows: `repeat(${maze.rows}, 44px)` }}
            >
              {Array.from({ length: maze.rows * maze.cols }, (_, i) => {
                const isRevealed = revealed[i]; // fog persists into test now — only what you've actually walked is known
                let cls = `maze-cell ${isRevealed ? "known" : "fog"}`;
                if (isRevealed) {
                  const w = getCellWalls(maze.walls, maze.rows, maze.cols, i);
                  if (w.top) cls += " wall-top";
                  if (w.right) cls += " wall-right";
                  if (w.bottom) cls += " wall-bottom";
                  if (w.left) cls += " wall-left";
                }
                const canMove = phase === "test" && adjacent(currentPos, i, maze.cols) && isOpen(maze.walls, maze.cols, currentPos, i);
                if (canMove) cls += " tappable";
                return (
                  <div key={i} className={cls} onClick={() => canMove && moveTo(i)}>
                    {i === maze.goal && <span className="goal-emoji">🚩</span>}
                    {i === maze.start && i !== maze.goal && currentPos !== i && <span className="start-mark">S</span>}
                    {currentPos === i && <span className="token" />}
                  </div>
                );
              })}
            </div>

            {result && (
              <p className="stage-msg big">
                {result.kind === "mapped" && "🗺️ You found the shortcut — that's a real cognitive map."}
                {result.kind === "retraced" && "You retraced the trained route — safe, but there was a shorter way."}
                {result.kind === "explored" && "You got a little lost — no penalty, the map's still forming."}
                {" "}
                <span className="mono">
                  ({result.userLen} steps · trained {result.trainedLen} · shortest {result.optimalLen})
                </span>
              </p>
            )}

            {msg && <p className="stage-msg">{msg}</p>}

            {phase === "ready" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn--ghost" onClick={watchAgain}>
                  Watch Again
                </button>
                <button className="btn btn--primary" onClick={startTest}>
                  Find the Goal →
                </button>
              </div>
            )}

            <div className="maze-legend">
              <span>
                <span className="swatch-dot" style={{ background: "var(--amber)" }} /> you
              </span>
              <span>🚩 goal</span>
              <span>striped squares = unexplored</span>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
