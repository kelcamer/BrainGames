import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { useNoScroll } from "../hooks/useNoScroll.js";

// Prefrontal Executive Network — prospective memory (rostral PFC / BA10). You do
// an absorbing ongoing task (sort Animal vs Object) while holding delayed
// intentions ("WHEN you see the fox, press ⭐ instead"). The intention is shown
// once, then hidden — you have to remember to act on the cue when it finally
// appears, several trials later, through the interference of the ongoing task.
// That's the exact shape of "sure, I'll feed the dog" → forgot.
const ANIMALS = [
  ["🐕", "dog"], ["🐈", "cat"], ["🐦", "bird"], ["🐢", "turtle"], ["🐟", "fish"], ["🐝", "bee"],
  ["🦊", "fox"], ["🐘", "elephant"], ["🐬", "dolphin"], ["🦉", "owl"], ["🐸", "frog"], ["🐴", "horse"],
];
const OBJECTS = [
  ["🔑", "key"], ["📕", "book"], ["🪑", "chair"], ["☂️", "umbrella"], ["🔨", "hammer"], ["🕯️", "candle"],
  ["🧦", "sock"], ["🍵", "tea"], ["⏰", "clock"], ["🧭", "compass"], ["🎈", "balloon"], ["🧵", "thread"],
];
const ALL = [...ANIMALS, ...OBJECTS];
const ANIMAL_SET = new Set(ANIMALS.map((a) => a[0]));
const nameOf = Object.fromEntries(ALL);
const kindOf = (emoji) => (ANIMAL_SET.has(emoji) ? "animal" : "object");

const T = 26; // ongoing trials
const K = 5; // errands to plant
const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// Build the whole session up front: a stream of ongoing trials, with errands
// assigned at one point and their cue emoji appearing several trials later.
function generateSteps() {
  const specials = shuffle(ALL).slice(0, K).map((x) => x[0]);
  const cuePositions = [];
  let p = 5;
  for (let k = 0; k < K; k++) { p += 3 + rnd(3); if (p >= T) break; cuePositions.push(p); }
  const used = specials.slice(0, cuePositions.length);

  const assignsAt = {};
  const cueAt = {};
  used.forEach((sp, k) => {
    const cpos = cuePositions[k];
    const apos = Math.max(0, cpos - (5 + rnd(4))); // 5–8 trials of delay
    cueAt[cpos] = sp;
    (assignsAt[apos] = assignsAt[apos] || []).push(sp);
  });

  const ongoingPool = ALL.filter((x) => !used.includes(x[0]));
  const steps = [];
  for (let t = 0; t < T; t++) {
    (assignsAt[t] || []).forEach((sp) => steps.push({ type: "assign", special: sp }));
    if (cueAt[t]) {
      steps.push({ type: "trial", stim: cueAt[t], correct: "star" });
    } else {
      const s = ongoingPool[rnd(ongoingPool.length)][0];
      steps.push({ type: "trial", stim: s, correct: kindOf(s) });
    }
  }
  return { steps, cues: used.length };
}

export default function OpenLoops({ onBack, onFinish, best }) {
  useNoScroll();
  const eng = useRef(null);
  const timers = useRef([]);
  const [phase, setPhase] = useState("play"); // play | summary
  const [, force] = useState(0);
  const [open, setOpen] = useState(0);
  const [flash, setFlash] = useState(null); // ok | bad
  const [summary, setSummary] = useState(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function start() {
    const { steps, cues } = generateSteps();
    eng.current = { steps, i: 0, pmHits: 0, pmCues: cues, ongHits: 0, ongTotal: 0, falseErrand: 0, active: 0, busy: false };
    setSummary(null);
    setFlash(null);
    setOpen(0);
    setPhase("play");
    force((n) => n + 1);
  }

  function advance() {
    const e = eng.current;
    e.i += 1;
    if (e.i >= e.steps.length) return finish();
    force((n) => n + 1);
  }

  function acknowledge() {
    const e = eng.current;
    if (!e || e.busy || phaseRef.current !== "play") return;
    if (e.steps[e.i]?.type !== "assign") return;
    e.active += 1;
    setOpen(e.active);
    advance();
  }

  function respond(kind) {
    const e = eng.current;
    if (!e || e.busy || phaseRef.current !== "play") return;
    const step = e.steps[e.i];
    if (!step || step.type !== "trial") return;
    let ok;
    if (step.correct === "star") {
      ok = kind === "star";
      if (ok) e.pmHits += 1;
      e.active = Math.max(0, e.active - 1); // the errand's cue has now passed, hit or miss
      setOpen(e.active);
    } else {
      e.ongTotal += 1;
      ok = kind === step.correct;
      if (ok) e.ongHits += 1;
      if (kind === "star") e.falseErrand += 1; // rang the bell on a non-errand
    }
    e.busy = true;
    setFlash(ok ? "ok" : "bad");
    timers.current.push(setTimeout(() => { e.busy = false; setFlash(null); advance(); }, 300));
  }

  function onKey(ev) {
    if (phaseRef.current !== "play" || !eng.current) return;
    const step = eng.current.steps[eng.current.i];
    if (!step) return;
    if (step.type === "assign") {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); acknowledge(); }
      return;
    }
    if (ev.key === "ArrowLeft") { ev.preventDefault(); respond("animal"); }
    else if (ev.key === "ArrowRight") { ev.preventDefault(); respond("object"); }
    else if (ev.key === "ArrowDown" || ev.key === " ") { ev.preventDefault(); respond("star"); }
  }

  function finish() {
    const e = eng.current;
    const pmPct = e.pmCues ? Math.round((e.pmHits / e.pmCues) * 100) : 0;
    const ongPct = e.ongTotal ? Math.round((e.ongHits / e.ongTotal) * 100) : 0;
    const prevBest = best.bestPct;
    const isBest = pmPct > 0 && pmPct > prevBest;
    const xpEarned = 15 + e.pmHits * 12 + Math.round(ongPct * 0.15);
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ bestPct: Math.max(prev.bestPct, pmPct), plays: prev.plays + 1 }),
    });
    setSummary({ pmPct, pmHits: e.pmHits, pmCues: e.pmCues, ongPct, falseErrand: e.falseErrand, xpEarned, isBest, bestShown: Math.max(prevBest, pmPct) });
    setPhase("summary");
  }

  useEffect(() => {
    start();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = eng.current?.steps[eng.current.i];

  return (
    <>
      <GameHeader color="var(--executive)" regionLabel="Prefrontal Executive Network · Open Loops" title="Open Loops" onBack={onBack}>
        <span className="stat-pill">
          Open loops <b className="mono">{open}</b>
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.bestPct}%</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            praise={summary.isBest ? "New personal best! 🏆" : undefined}
            eyebrow={summary.isBest ? "new high score!" : "shift over"}
            bigNum={`${summary.pmPct}%`}
            detail={`errands remembered · ${summary.pmHits}/${summary.pmCues} · ongoing sort ${summary.ongPct}% · ${summary.falseErrand} false ⭐ · best ${summary.bestShown}% · +${summary.xpEarned} xp`}
            onAgain={start}
            againLabel="New Shift"
            onBack={onBack}
          />
        ) : step?.type === "assign" ? (
          <div className="ol-assign">
            <div className="ol-eyebrow">new errand</div>
            <div className="ol-assign-emoji">{step.special}</div>
            <p className="ol-if-then">
              WHEN you see the <b>{nameOf[step.special]}</b>, press <b>⭐</b> — not Animal or Object.
            </p>
            <p className="stage-msg mono">say it to yourself, then continue</p>
            <button className="btn btn--primary" onClick={acknowledge}>
              Got it
            </button>
          </div>
        ) : step ? (
          <div className="ol-play">
            <p className="stage-msg">sort it — <b>Animal</b> or <b>Object</b> — unless it's an errand cue, then <b>⭐</b></p>
            <div className={"ol-stim" + (flash ? ` ol-${flash}` : "")}>{step.stim}</div>
            <div className="ol-answers">
              <button className="btn ol-btn" onPointerDown={(ev) => { ev.preventDefault(); respond("animal"); }}>🐾 Animal <span className="mono">←</span></button>
              <button className="btn ol-btn ol-btn--star" onPointerDown={(ev) => { ev.preventDefault(); respond("star"); }}>⭐ Errand <span className="mono">↓</span></button>
              <button className="btn ol-btn" onPointerDown={(ev) => { ev.preventDefault(); respond("object"); }}>📦 Object <span className="mono">→</span></button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
