import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const TOTAL = 30;
const KEYMAP = { ArrowLeft: "L", ArrowRight: "R" };
const GREEN = "#5fc97f";
const ORANGE = "#e8913c";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Response window shrinks as the run goes on, so the pressure ramps up.
const deadline = (trial) => clamp(2600 - (trial - 1) * 45, 1300, 2600);

// Prefrontal Executive Network — cognitive flexibility (the Lumosity "Ebb and
// Flow" task). A leaf both *points* one way and *drifts* another. The colour is
// the rule: a GREEN leaf means answer where it points; an ORANGE leaf means
// answer where it's drifting. When the two directions disagree you have to hold
// the rule and suppress the other cue — dorsolateral-PFC set-shifting plus
// response inhibition, live.
function Leaf({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      {/* stem (tail) — marks the back of the leaf, so the tip reads as "pointing" */}
      <path d="M13 24 L4 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* blade, tip at the right */}
      <path d="M13 24 C 20 13, 34 13, 43 24 C 34 35, 20 35, 13 24 Z" fill="currentColor" />
      {/* midrib + veins angled toward the tip */}
      <path d="M15 24 H 40" stroke="rgba(0,0,0,0.28)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M24 24 l4 -4 M24 24 l4 4 M30 24 l4 -4 M30 24 l4 4" stroke="rgba(0,0,0,0.22)" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export default function EbbFlow({ onBack, onFinish, best }) {
  const eng = useRef({ trial: 0, correct: 0, answered: 0, rtSum: 0, incCorrect: 0, incTotal: 0, timeouts: 0, stim: null, awaiting: false, t0: 0 });
  const timers = useRef([]);
  const [count, setCount] = useState(0);
  const [stim, setStim] = useState(null); // { color: 'green'|'orange', point: 'L'|'R', move: 'L'|'R' }
  const [flash, setFlash] = useState(null); // ok | bad
  const [dur, setDur] = useState(2000);
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function nextTrial() {
    clearTimers();
    const e = eng.current;
    if (e.trial >= TOTAL) return finish();
    e.trial += 1;
    setCount(e.trial);
    e.stim = {
      color: Math.random() < 0.5 ? "green" : "orange",
      point: Math.random() < 0.5 ? "L" : "R",
      move: Math.random() < 0.5 ? "L" : "R",
    };
    setStim(e.stim);
    setFlash(null);
    e.t0 = performance.now();
    e.awaiting = true;
    const dl = deadline(e.trial);
    setDur(dl);
    timers.current.push(setTimeout(onTimeout, dl));
  }

  function score(ok, incong, rt) {
    const e = eng.current;
    e.answered += 1;
    if (incong) e.incTotal += 1;
    if (ok) {
      e.correct += 1;
      e.rtSum += rt;
      if (incong) e.incCorrect += 1;
    }
    setFlash(ok ? "ok" : "bad");
    timers.current.push(setTimeout(nextTrial, 360));
  }

  function answer(side) {
    const e = eng.current;
    if (!e.awaiting || !e.stim) return;
    e.awaiting = false;
    clearTimers(); // cancel the miss timeout for this trial
    const s = e.stim;
    const correctSide = s.color === "green" ? s.point : s.move;
    score(side === correctSide, s.point !== s.move, performance.now() - e.t0);
  }

  function onTimeout() {
    const e = eng.current;
    if (!e.awaiting || !e.stim) return;
    e.awaiting = false;
    e.timeouts += 1;
    score(false, e.stim.point !== e.stim.move, 0); // ran out the clock — counts as a miss
  }

  function onKey(ev) {
    const dir = KEYMAP[ev.key];
    if (!dir) return;
    ev.preventDefault(); // stop the browser's native page-scroll on arrow keys
    if (ev.repeat) return; // ignore OS key-auto-repeat from a held key
    answer(dir);
  }

  function finish() {
    const e = eng.current;
    const acc = Math.round((e.correct / TOTAL) * 100);
    const avgRt = e.correct ? Math.round(e.rtSum / e.correct) : 0;
    const prevBest = best.bestScore;
    const isBest = e.correct > 0 && e.correct > prevBest;
    const xpEarned = 15 + e.correct * 5;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ bestScore: Math.max(prev.bestScore, e.correct), accuracy: Math.max(prev.accuracy, acc), plays: prev.plays + 1 }),
    });
    setSummary({ score: e.correct, acc, avgRt, incCorrect: e.incCorrect, incTotal: e.incTotal, xpEarned, isBest, bestShown: Math.max(prevBest, e.correct) });
  }

  function start() {
    eng.current = { trial: 0, correct: 0, answered: 0, rtSum: 0, incCorrect: 0, incTotal: 0, timeouts: 0, stim: null, awaiting: false, t0: 0 };
    setSummary(null);
    setCount(0);
    setStim(null);
    setFlash(null);
    timers.current.push(setTimeout(nextTrial, 500));
  }

  useEffect(() => {
    start();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimers();
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GameHeader color="var(--executive)" regionLabel="Prefrontal Executive Network · Ebb and Flow" title="Ebb and Flow" onBack={onBack}>
        <span className="stat-pill">
          Trial <b className="mono">{count}/{TOTAL}</b>
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.bestScore}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            praise={summary.isBest ? "New personal best! 🏆" : undefined}
            eyebrow={summary.isBest ? "new high score!" : "run complete"}
            bigNum={summary.score}
            detail={`correct of ${TOTAL} · ${summary.acc}% accuracy · held ${summary.incCorrect}/${summary.incTotal} conflict trials · avg ${summary.avgRt}ms · best ${summary.bestShown} · +${summary.xpEarned} xp`}
            onAgain={start}
            againLabel="Play Again"
            onBack={onBack}
          />
        ) : (
          <>
            <div className="ef-legend">
              <span>
                <b style={{ color: GREEN }}>GREEN</b> → where it points
              </span>
              <span>
                <b style={{ color: ORANGE }}>ORANGE</b> → where it's drifting
              </span>
            </div>
            <div className="ef-cue">
              {stim &&
                (stim.color === "green" ? (
                  <>
                    press where the leaf <b style={{ color: GREEN }}>points</b>
                  </>
                ) : (
                  <>
                    press where the leaf is <b style={{ color: ORANGE }}>drifting</b>
                  </>
                ))}
            </div>
            <div className={"ef-field" + (flash ? ` ef-${flash}` : "")}>
              {stim && (
                <div key={count} className="ef-drift" style={{ animation: `${stim.move === "R" ? "ef-drift-r" : "ef-drift-l"} ${dur}ms linear both` }}>
                  <Leaf className={`ef-leaf ${stim.color}${stim.point === "L" ? " point-left" : ""}`} />
                </div>
              )}
            </div>
            <div className="ef-controls">
              <button className="btn ef-arrow-btn" aria-label="left" onPointerDown={(ev) => { ev.preventDefault(); answer("L"); }}>
                ←
              </button>
              <button className="btn ef-arrow-btn" aria-label="right" onPointerDown={(ev) => { ev.preventDefault(); answer("R"); }}>
                →
              </button>
            </div>
            <p className="stage-msg mono">← → arrow keys or tap</p>
          </>
        )}
      </div>
    </>
  );
}
