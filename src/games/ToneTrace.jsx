import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { playTone } from "../audio/tones.js";
import { cheer } from "../data/praise.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (n) => Math.floor(Math.random() * n);
const FREQS = [261.63, 329.63, 392.0, 523.25];
const COLORS = ["var(--visual)", "var(--auditory)", "var(--motor)", "var(--wordform)"];

// Auditory Cortex — two sub-games. Sequence Memory is a Simon-style growing-tone
// recall; Pitch Duel is a raw pitch-discrimination staircase (which tone was higher).
export default function ToneTrace({ onBack, onFinish, best }) {
  const [tab, setTab] = useState("seq");
  return (
    <>
      <GameHeader color="var(--auditory)" regionLabel="Auditory Cortex · Tone Trace" title="Tone Trace" onBack={onBack}>
        <span className="stat-pill">
          Best seq <b className="mono">{best.maxSeq}</b>
        </span>
      </GameHeader>
      <div className="tt-tabs">
        <button className={tab === "seq" ? "active" : ""} onClick={() => setTab("seq")}>
          Sequence Memory
        </button>
        <button className={tab === "pitch" ? "active" : ""} onClick={() => setTab("pitch")}>
          Pitch Duel
        </button>
      </div>
      <div className="game-stage">{tab === "seq" ? <SequenceMode onFinish={onFinish} onBack={onBack} /> : <PitchDuel onFinish={onFinish} />}</div>
    </>
  );
}

function SequenceMode({ onFinish, onBack }) {
  const eng = useRef({ sequence: [], playerPos: 0, playing: false });
  const timers = useRef([]);
  const [lit, setLit] = useState(-1);
  const [msg, setMsg] = useState("watch the sequence");
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function litPad(i, ms) {
    setLit(i);
    playTone(FREQS[i], ms || 350);
    timers.current.push(setTimeout(() => setLit((cur) => (cur === i ? -1 : cur)), ms || 350));
  }

  function growSequence() {
    const e = eng.current;
    e.sequence.push(rnd(4));
    e.playerPos = 0;
    e.playing = true;
    setMsg(`watch the sequence — length ${e.sequence.length}`);
    let i = 0;
    function step() {
      if (i >= e.sequence.length) {
        e.playing = false;
        setMsg("your turn");
        return;
      }
      litPad(e.sequence[i], 340);
      i++;
      timers.current.push(setTimeout(step, 520));
    }
    timers.current.push(setTimeout(step, 400));
  }

  function padClicked(i) {
    const e = eng.current;
    if (e.playing) return;
    litPad(i, 220);
    if (e.sequence[e.playerPos] === i) {
      e.playerPos++;
      if (e.playerPos >= e.sequence.length) {
        setMsg("nice — next round");
        cheer();
        timers.current.push(setTimeout(growSequence, 700));
      }
    } else {
      endSeq();
    }
  }

  function endSeq() {
    const e = eng.current;
    const achieved = e.sequence.length - 1;
    const xpEarned = 15 + achieved * 10;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ maxSeq: Math.max(prev.maxSeq, achieved), minPitchDiff: prev.minPitchDiff, plays: prev.plays + 1 }),
    });
    setSummary({ achieved, xpEarned });
  }

  function start() {
    eng.current = { sequence: [], playerPos: 0, playing: false };
    setSummary(null);
    setMsg("watch the sequence");
    timers.current.push(setTimeout(growSequence, 500));
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (summary) {
    return (
      <SessionSummary
        eyebrow="sequence broken"
        bigNum={summary.achieved}
        detail={`tones remembered in a row · +${summary.xpEarned} xp to Auditory Cortex`}
        onAgain={start}
        againLabel="Try Again"
        onBack={onBack}
      />
    );
  }
  return (
    <>
      <div className="tt-pad-grid">
        {FREQS.map((f, i) => (
          <button
            key={i}
            className={`tt-pad ${lit === i ? "lit" : ""}`}
            style={{ color: COLORS[i], background: `color-mix(in srgb, ${COLORS[i]} 13%, transparent)` }}
            onClick={() => padClicked(i)}
          />
        ))}
      </div>
      <p className="stage-msg">{msg}</p>
    </>
  );
}

function PitchDuel({ onFinish }) {
  const eng = useRef({ pitchDiff: 110, streak: 0, plays: 0 });
  const [round, setRound] = useState(null); // { f1, f2, secondHigher }
  const [streak, setStreak] = useState(0);
  const [diff, setDiff] = useState(110);
  const [showAnswers, setShowAnswers] = useState(false);
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function newRound() {
    const base = 300 + rnd(200);
    const secondHigher = Math.random() < 0.5;
    const f1 = secondHigher ? base : base + eng.current.pitchDiff;
    const f2 = secondHigher ? base + eng.current.pitchDiff : base;
    setRound({ f1, f2, secondHigher });
    setShowAnswers(false);
  }

  function playRound() {
    if (!round) return;
    playTone(round.f1, 380);
    timers.current.push(setTimeout(() => playTone(round.f2, 380), 550));
    timers.current.push(setTimeout(() => setShowAnswers(true), 1100));
  }

  function answer(said2nd) {
    const correct = said2nd === round.secondHigher;
    eng.current.pitchDiff = correct ? clamp(eng.current.pitchDiff * 0.82, 6, 220) : clamp(eng.current.pitchDiff * 1.25, 6, 220);
    eng.current.streak = correct ? eng.current.streak + 1 : 0;
    setStreak(eng.current.streak);
    setDiff(Math.round(eng.current.pitchDiff));
    if (correct) {
      cheer();
      onFinish({
        xpEarned: 6,
        updateBest: (prev) => ({ ...prev, minPitchDiff: Math.min(prev.minPitchDiff, eng.current.pitchDiff) }),
        registerSession: false, // a single correct guess isn't its own session — just a small XP tick
      });
    }
    if (eng.current.streak > 0 && eng.current.streak % 8 === 0) {
      onFinish({ xpEarned: 0, updateBest: (prev) => ({ ...prev, plays: prev.plays + 1 }) });
    }
    newRound();
  }

  useEffect(() => {
    newRound();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <p className="stage-msg big">Which tone was higher?</p>
      <p className="stage-msg">
        streak <b className="mono">{streak}</b> · gap <b className="mono">{diff}</b> Hz
      </p>
      <div className="pd-row">
        <button className="pd-btn" onClick={playRound}>
          ▶ Play tones
        </button>
      </div>
      {showAnswers && (
        <div className="pd-row">
          <button className="pd-btn" onClick={() => answer(false)}>
            First was higher
          </button>
          <button className="pd-btn" onClick={() => answer(true)}>
            Second was higher
          </button>
        </div>
      )}
    </>
  );
}
