import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const TOTAL = 28;
const GO_PROB = 0.72;

// Prefrontal Executive Network — response inhibition (Go/No-Go). Tap the
// circles fast; withhold on the triangles. False alarms (tapping a triangle)
// are the real measure — that's the inhibition failure the task probes, tied
// to right inferior frontal cortex and the anterior cingulate.
export default function GoNoGo({ onBack, onFinish, best }) {
  const eng = useRef({ trial: 0, hits: 0, cr: 0, fa: 0, miss: 0, isGo: true, responded: false, win: 850 });
  const timers = useRef([]);
  const [stim, setStim] = useState(null); // "go" | "nogo" | null(blank)
  const [flash, setFlash] = useState(null); // "hit" | "fa" | "miss" | "cr"
  const [phase, setPhase] = useState("play");
  const [summary, setSummary] = useState(null);
  const [count, setCount] = useState(0);

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
    e.isGo = Math.random() < GO_PROB;
    e.responded = false;
    e.win = Math.max(600, 850 - e.trial * 6); // speeds up a little as you go
    setFlash(null);
    setStim(e.isGo ? "go" : "nogo");
    timers.current.push(
      setTimeout(() => {
        // window closed with no tap
        if (!e.responded) {
          if (e.isGo) {
            e.miss += 1;
            setFlash("miss");
          } else {
            e.cr += 1;
            setFlash("cr");
          }
        }
        setStim(null);
        timers.current.push(setTimeout(nextTrial, 320));
      }, e.win)
    );
  }

  function respond() {
    const e = eng.current;
    if (phase !== "play" || stim === null || e.responded) return;
    e.responded = true;
    if (e.isGo) {
      e.hits += 1;
      setFlash("hit");
    } else {
      e.fa += 1;
      setFlash("fa");
    }
  }

  function finish() {
    const e = eng.current;
    const correct = e.hits + e.cr;
    const acc = Math.round((correct / TOTAL) * 100);
    const xpEarned = 15 + e.hits * 4 + e.cr * 8; // correct withholds are worth more
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ accuracy: Math.max(prev.accuracy, acc), plays: prev.plays + 1 }),
    });
    setSummary({ acc, fa: e.fa, miss: e.miss, xpEarned });
  }

  function start() {
    eng.current = { trial: 0, hits: 0, cr: 0, fa: 0, miss: 0, isGo: true, responded: false, win: 850 };
    setSummary(null);
    setPhase("play");
    setCount(0);
    timers.current.push(setTimeout(nextTrial, 500));
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashClass = flash ? ` gng-${flash}` : "";

  return (
    <>
      <GameHeader color="var(--executive)" regionLabel="Prefrontal Executive Network · Go / No-Go" title="Go / No-Go" onBack={onBack}>
        <span className="stat-pill">
          Trial <b className="mono">{count}/{TOTAL}</b>
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.accuracy}%</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={`${summary.acc}%`}
            detail={`accuracy · ${summary.fa} false alarms (tapped a triangle), ${summary.miss} misses · +${summary.xpEarned} xp to Prefrontal Executive Network`}
            onAgain={start}
            againLabel="Try Again"
            onBack={onBack}
          />
        ) : (
          <>
            <button
              className={"gng-stage" + flashClass}
              onPointerDown={(ev) => {
                ev.preventDefault();
                respond();
              }}
              aria-label="tap target"
            >
              {stim === "go" && <span className="gng-shape gng-circle" />}
              {stim === "nogo" && <span className="gng-shape gng-triangle" />}
            </button>
            <p className="stage-msg big">
              Tap the <b style={{ color: "var(--executive)" }}>circles</b> — never the <b>triangles</b>.
            </p>
          </>
        )}
      </div>
    </>
  );
}
