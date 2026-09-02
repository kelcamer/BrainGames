import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import HoldBar from "../components/HoldBar.jsx";
import { randomConsolation } from "../data/praise.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (n) => Math.floor(Math.random() * n);
const range = (n) => Array.from({ length: n }, (_, i) => i);
const GRID_N = 16;

// Hippocampus, hard mode — the real Corsi block-tapping test. Identical blank
// tiles light up in a growing sequence; no shape or color to recode into
// words, so position is the only information there is to hold onto.
export default function TraceMapHard({ onBack, onFinish, best }) {
  const eng = useRef({ sequence: [], playerPos: 0, holdMs: 1000 });
  const timers = useRef([]);
  const [lit, setLit] = useState(-1);
  const [wrong, setWrong] = useState(-1);
  const [phase, setPhase] = useState("watch"); // watch | hold | input | summary
  const [msg, setMsg] = useState("watch closely — nothing here to name");
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function grow() {
    const e = eng.current;
    e.sequence.push(rnd(GRID_N));
    e.playerPos = 0;
    playSequence();
  }

  function playSequence() {
    const e = eng.current;
    setPhase("watch");
    setWrong(-1);
    setMsg(`watch — length ${e.sequence.length}`);
    let i = 0;
    function step() {
      if (i >= e.sequence.length) {
        timers.current.push(setTimeout(startHold, 350));
        return;
      }
      const idx = e.sequence[i];
      setLit(idx);
      timers.current.push(setTimeout(() => setLit((cur) => (cur === idx ? -1 : cur)), 380));
      i++;
      timers.current.push(setTimeout(step, 520));
    }
    timers.current.push(setTimeout(step, 400));
  }

  function startHold() {
    setMsg("hold it in mind…");
    setPhase("hold");
    timers.current.push(setTimeout(startInput, eng.current.holdMs));
  }

  function startInput() {
    setMsg("tap them back in order");
    setPhase("input");
  }

  function onTap(idx) {
    const e = eng.current;
    setLit(idx);
    timers.current.push(setTimeout(() => setLit((cur) => (cur === idx ? -1 : cur)), 200));
    if (e.sequence[e.playerPos] === idx) {
      e.playerPos++;
      if (e.playerPos >= e.sequence.length) {
        setMsg("clean — next round");
        e.holdMs = clamp(e.holdMs + 200, 800, 5000);
        timers.current.push(setTimeout(grow, 700));
      }
    } else {
      setWrong(idx);
      timers.current.push(setTimeout(endRun, 550));
    }
  }

  function endRun() {
    const e = eng.current;
    const achieved = e.sequence.length - 1;
    const xpEarned = 20 + achieved * 14;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ maxSpan: Math.max(prev.maxSpan, achieved), plays: prev.plays + 1 }),
    });
    setSummary({ achieved, xpEarned, praise: randomConsolation() });
  }

  function start() {
    eng.current = { sequence: [], playerPos: 0, holdMs: 1000 };
    setSummary(null);
    setMsg("watch closely — nothing here to name");
    timers.current.push(setTimeout(grow, 700));
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Hard Mode" title="Trace Map: Hard Mode" onBack={onBack}>
        <span className="stat-pill">
          Best span <b className="mono">{best.maxSpan}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            praise={summary.praise}
            eyebrow="sequence broken"
            bigNum={summary.achieved}
            detail={`tiles held in order, position only · +${summary.xpEarned} xp to Hippocampus`}
            onAgain={start}
            againLabel="Try Again"
            onBack={onBack}
          />
        ) : (
          <>
            <div className="tm-grid">
              {range(GRID_N).map((idx) => {
                let cls = "tm-cell";
                if (phase === "input") cls += " tappable";
                if (lit === idx) cls += " lit";
                if (wrong === idx) cls += " wrong";
                return (
                  <div
                    key={idx}
                    className={cls}
                    onPointerDown={(e) => {
                      if (phase !== "input") return;
                      e.preventDefault(); // stops the browser from also firing a trailing synthesized click for this tap
                      onTap(idx);
                    }}
                  />
                );
              })}
            </div>
            {phase === "hold" && <HoldBar ms={eng.current?.holdMs || 1000} />}
            <p className="stage-msg">{msg}</p>
          </>
        )}
      </div>
    </>
  );
}
