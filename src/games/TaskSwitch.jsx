import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const TOTAL = 24;
const rnd = (n) => Math.floor(Math.random() * n);

// Prefrontal Executive Network — task switching / cognitive flexibility. The
// rule flips between COLOR and SHAPE; you answer by whichever rule is currently
// showing. The cost you pay right after a switch is the classic index of
// set-shifting (dorsolateral PFC).
export default function TaskSwitch({ onBack, onFinish, best }) {
  const eng = useRef({ trial: 0, correct: 0, rule: "COLOR", stim: null, switches: 0, switchCorrect: 0, t0: 0 });
  const timers = useRef([]);
  const [rule, setRule] = useState("COLOR");
  const [stim, setStim] = useState(null); // { color: 'red'|'blue', shape: 'circle'|'square' }
  const [flash, setFlash] = useState(null); // ok | bad
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState("play");
  const [summary, setSummary] = useState(null);
  const [wasSwitch, setWasSwitch] = useState(false);

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
    const prevRule = e.rule;
    // ~45% chance the rule flips
    if (e.trial > 1 && Math.random() < 0.45) e.rule = e.rule === "COLOR" ? "SHAPE" : "COLOR";
    const isSwitch = e.trial > 1 && e.rule !== prevRule;
    if (isSwitch) e.switches += 1;
    setWasSwitch(isSwitch);
    e.stim = { color: rnd(2) ? "red" : "blue", shape: rnd(2) ? "circle" : "square" };
    e.t0 = performance.now();
    setRule(e.rule);
    setStim(e.stim);
    setFlash(null);
  }

  // For COLOR: red → left, blue → right. For SHAPE: circle → left, square → right.
  function answer(side) {
    const e = eng.current;
    if (phase !== "play" || !e.stim) return;
    const correctSide = e.rule === "COLOR" ? (e.stim.color === "red" ? "L" : "R") : e.stim.shape === "circle" ? "L" : "R";
    const ok = side === correctSide;
    if (ok) {
      e.correct += 1;
      if (wasSwitch) e.switchCorrect += 1;
      setFlash("ok");
    } else {
      setFlash("bad");
    }
    timers.current.push(setTimeout(nextTrial, 420));
  }

  function finish() {
    const e = eng.current;
    const acc = Math.round((e.correct / TOTAL) * 100);
    const xpEarned = 15 + e.correct * 6;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ accuracy: Math.max(prev.accuracy, acc), plays: prev.plays + 1 }),
    });
    setSummary({ acc, switches: e.switches, switchCorrect: e.switchCorrect, xpEarned });
  }

  function start() {
    eng.current = { trial: 0, correct: 0, rule: rnd(2) ? "COLOR" : "SHAPE", stim: null, switches: 0, switchCorrect: 0, t0: 0 };
    setSummary(null);
    setPhase("play");
    setCount(0);
    timers.current.push(setTimeout(nextTrial, 400));
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorHex = stim ? (stim.color === "red" ? "var(--danger)" : "var(--visual)") : "transparent";
  const leftLabel = rule === "COLOR" ? "RED" : "● CIRCLE";
  const rightLabel = rule === "COLOR" ? "BLUE" : "■ SQUARE";

  return (
    <>
      <GameHeader color="var(--executive)" regionLabel="Prefrontal Executive Network · Task Switch" title="Task Switch" onBack={onBack}>
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
            detail={`accuracy · held ${summary.switchCorrect}/${summary.switches} rule-switch trials · +${summary.xpEarned} xp to Prefrontal Executive Network`}
            onAgain={start}
            againLabel="Try Again"
            onBack={onBack}
          />
        ) : (
          <>
            <div className={"ts-rule" + (wasSwitch ? " ts-switched" : "")}>
              sort by <b>{rule}</b>
              {wasSwitch && <span className="ts-flip"> — rule changed!</span>}
            </div>
            <div className={"ts-stim" + (flash ? ` ts-${flash}` : "")}>
              {stim &&
                (stim.shape === "circle" ? (
                  <span className="ts-shape" style={{ background: colorHex, borderRadius: "50%" }} />
                ) : (
                  <span className="ts-shape" style={{ background: colorHex, borderRadius: "8px" }} />
                ))}
            </div>
            <div className="ts-answers">
              <button className="btn" onPointerDown={(ev) => { ev.preventDefault(); answer("L"); }}>
                {leftLabel}
              </button>
              <button className="btn" onPointerDown={(ev) => { ev.preventDefault(); answer("R"); }}>
                {rightLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
