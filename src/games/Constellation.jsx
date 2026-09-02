import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { cheer } from "../data/praise.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (n) => Math.floor(Math.random() * n);
const MAX_CELLS = 81; // grid stops growing past 9x9 — count can still climb from here via density alone

// Hippocampus — simultaneous visuospatial span (not sequence order, not
// item-identity binding — a set of locations flashed at once, the way
// change-detection / spatial-span capacity tasks work). Squares light up
// together; you pick the same set back. Get it right and the count climbs
// by one *and* the grid grows a size — wrong ends the run. Reports the
// longest span you actually held.
export default function Constellation({ onBack, onFinish, best }) {
  const eng = useRef({ gridRows: 5, gridCols: 5, litCount: 6, achievedSpan: 0, growToggle: true, litSet: new Set(), exposure: 1200 });
  const timers = useRef([]);
  const lastToggle = useRef({ i: -1, t: 0 });
  const [uiSpan, setUiSpan] = useState(6);
  const [phase, setPhase] = useState("show"); // show | recall | result | summary
  const [selected, setSelected] = useState([]);
  const [resultInfo, setResultInfo] = useState(null);
  const [msg, setMsg] = useState("memorize the lit squares…");
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function growGrid(e) {
    if (e.gridRows * e.gridCols < MAX_CELLS) {
      if (e.growToggle) e.gridCols += 1;
      else e.gridRows += 1;
      e.growToggle = !e.growToggle;
    }
  }

  function nextRound() {
    clearTimers();
    const e = eng.current;
    const total = e.gridRows * e.gridCols;
    const litSet = new Set();
    while (litSet.size < e.litCount) litSet.add(rnd(total));
    e.litSet = litSet;
    e.exposure = clamp(900 + e.litCount * 150, 900, 3500);
    lastToggle.current = { i: -1, t: 0 };
    setUiSpan(e.litCount);
    setSelected(new Array(total).fill(false));
    setResultInfo(null);
    setPhase("show");
    setMsg(`memorize ${e.litCount} squares…`);
    timers.current.push(
      setTimeout(() => {
        setPhase("recall");
        setMsg("click the squares that lit up, then submit");
      }, e.exposure)
    );
  }

  function toggleCell(i) {
    if (phase !== "recall") return;
    // Guard against a duplicate event for one tap (touch + a synthesized
    // "ghost" click is a known mobile-browser pattern). This matters more
    // here than elsewhere in the app: toggling is its own inverse, so two
    // firings for a single tap cancel out exactly — select, then instantly
    // un-select — which read as "I picked it and it cleared my selection."
    const now = Date.now();
    const last = lastToggle.current;
    if (last.i === i && now - last.t < 350) return;
    lastToggle.current = { i, t: now };
    setSelected((prev) => {
      const next = prev.slice();
      if (next[i]) {
        next[i] = false;
      } else {
        if (prev.filter(Boolean).length >= eng.current.litCount) return prev; // already picked the right number
        next[i] = true;
      }
      return next;
    });
  }

  function submit() {
    const e = eng.current;
    const total = e.gridRows * e.gridCols;
    let correct = true;
    for (let i = 0; i < total; i++) {
      if (e.litSet.has(i) !== !!selected[i]) {
        correct = false;
        break;
      }
    }
    setResultInfo({ correct });
    setPhase("result");
    if (correct) {
      setMsg("clean — next round");
      cheer();
      e.achievedSpan = e.litCount;
      timers.current.push(
        setTimeout(() => {
          growGrid(e);
          // Clamp against the grid's actual capacity — without this, an
          // exceptional run could push litCount toward the cell count and
          // hang the "pick N unique cells" loop in nextRound() forever.
          e.litCount = Math.min(e.litCount + 1, e.gridRows * e.gridCols - 3);
          nextRound();
        }, 1300)
      );
    } else {
      setMsg("that wasn't the set — run over");
      timers.current.push(setTimeout(finish, 1600));
    }
  }

  function finish() {
    const e = eng.current;
    const achieved = e.achievedSpan;
    const xpEarned = 20 + achieved * 12;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ maxSpan: Math.max(prev.maxSpan, achieved), plays: prev.plays + 1 }),
    });
    setSummary({ achieved, xpEarned });
  }

  function start() {
    eng.current = { gridRows: 5, gridCols: 5, litCount: 6, achievedSpan: 0, growToggle: true, litSet: new Set(), exposure: 1200 };
    setSummary(null);
    nextRound();
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const e = eng.current;
  const total = e.gridRows * e.gridCols;
  const pickedCount = selected.filter(Boolean).length;
  const canSubmit = phase === "recall" && pickedCount === e.litCount;

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Constellation" title="Constellation" onBack={onBack}>
        <span className="stat-pill">
          Span <b className="mono">{uiSpan}</b>
        </span>
        <span className="stat-pill">
          Best span <b className="mono">{best.maxSpan}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={summary.achieved}
            detail={`squares held at once, at your best · +${summary.xpEarned} xp to Hippocampus`}
            onAgain={start}
            againLabel="Try Again"
            onBack={onBack}
          />
        ) : (
          <>
            <div className="cst-grid" style={{ gridTemplateColumns: `repeat(${e.gridCols}, 1fr)`, gridTemplateRows: `repeat(${e.gridRows}, 1fr)` }}>
              {Array.from({ length: total }, (_, i) => {
                let cls = "cst-cell";
                if (phase === "show" && e.litSet.has(i)) cls += " lit";
                if (phase === "recall" && selected[i]) cls += " selected";
                if (phase === "result") {
                  const wasLit = e.litSet.has(i);
                  const wasSelected = !!selected[i];
                  if (wasLit && wasSelected) cls += " correct";
                  else if (wasLit && !wasSelected) cls += " missed";
                  else if (!wasLit && wasSelected) cls += " wrong";
                }
                if (phase === "recall") cls += " tappable";
                return (
                  <div
                    key={i}
                    className={cls}
                    onPointerDown={(e) => {
                      e.preventDefault(); // stops the browser from also firing a trailing synthesized click for this tap
                      toggleCell(i);
                    }}
                  />
                );
              })}
            </div>
            <p className="stage-msg">{msg}</p>
            {phase === "recall" && (
              <>
                <p className="stage-msg mono">
                  picked {pickedCount}/{e.litCount}
                </p>
                <button className="btn btn--primary" disabled={!canSubmit} onClick={submit}>
                  Submit
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
