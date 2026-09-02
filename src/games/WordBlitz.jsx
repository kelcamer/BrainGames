import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const TOTAL = 12;
const WORDS = [
  "ANCHOR", "GARDEN", "PENCIL", "VOYAGE", "MARBLE", "SILVER", "WINTER", "BRIDGE",
  "CANDLE", "MIRROR", "PLANET", "VELVET", "HARBOR", "GRANITE", "WHISTLE", "LANTERN",
  "THUNDER", "CRYSTAL", "MEADOW", "RIBBON",
];
const COLOR_WORDS = [
  { name: "RED", hex: "#e6626e" },
  { name: "BLUE", hex: "#5aa9e6" },
  { name: "GREEN", hex: "#5ecf9e" },
  { name: "YELLOW", hex: "#f5b94d" },
];

// Word-Form Area — rapid flashed-word ID, interleaved every third round with a
// Stroop ink-color trap. Trains rapid visual word-form recognition and
// interference resolution.
export default function WordBlitz({ onBack, onFinish }) {
  const eng = useRef({ round: 0, streak: 0, correct: 0, exposure: 650 });
  const timers = useRef([]);
  const [uiRound, setUiRound] = useState(0);
  const [uiStreak, setUiStreak] = useState(0);
  const [phase, setPhase] = useState(null); // {kind:'flash-reading'|'flash-choices'|'stroop', ...}
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function nextRound() {
    clearTimers();
    const e = eng.current;
    if (e.round >= TOTAL) return finish();
    e.round++;
    setUiRound(e.round);
    if (e.round % 3 === 0) stroopRound();
    else flashRound();
  }

  function flashRound() {
    const e = eng.current;
    const word = pick(WORDS);
    setPhase({ kind: "reading", word });
    timers.current.push(
      setTimeout(() => {
        const distractors = [];
        while (distractors.length < 2) {
          const w = pick(WORDS);
          if (w !== word && !distractors.includes(w)) distractors.push(w);
        }
        const choices = [word, ...distractors].sort(() => Math.random() - 0.5);
        setPhase({ kind: "choices", word, choices });
      }, e.exposure)
    );
  }

  function stroopRound() {
    const word = pick(COLOR_WORDS);
    const ink = pick(COLOR_WORDS);
    setPhase({ kind: "stroop", word, ink, swatches: [...COLOR_WORDS].sort(() => Math.random() - 0.5) });
  }

  function answer(isCorrect) {
    const e = eng.current;
    if (isCorrect) {
      e.streak++;
      e.correct++;
      setUiStreak(e.streak);
      e.exposure = clamp(e.exposure - 25, 220, 700);
    } else {
      e.streak = 0;
      setUiStreak(0);
      e.exposure = clamp(e.exposure + 30, 220, 700);
    }
    timers.current.push(setTimeout(nextRound, 350));
  }

  function finish() {
    const e = eng.current;
    const acc = Math.round((e.correct / TOTAL) * 100);
    const xpEarned = 20 + e.correct * 8;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        accuracy: Math.max(prev.accuracy, acc),
        bestStreak: Math.max(prev.bestStreak, e.streak),
        plays: prev.plays + 1,
      }),
    });
    setSummary({ acc, xpEarned });
  }

  function start() {
    eng.current = { round: 0, streak: 0, correct: 0, exposure: 650 };
    setUiRound(0);
    setUiStreak(0);
    setSummary(null);
    nextRound();
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GameHeader color="var(--wordform)" regionLabel="Word-Form Area · Word Blitz" title="Word Blitz" onBack={onBack}>
        <span className="stat-pill">
          Round{" "}
          <b className="mono">
            {uiRound}/{TOTAL}
          </b>
        </span>
        <span className="stat-pill">
          Streak <b className="mono">{uiStreak}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="session complete"
            bigNum={`${summary.acc}%`}
            detail={`accuracy over ${TOTAL} rounds · +${summary.xpEarned} xp to Word-Form Area`}
            onAgain={start}
            onBack={onBack}
          />
        ) : phase?.kind === "reading" ? (
          <>
            <div className="wb-word">{phase.word}</div>
            <p className="stage-msg">reading…</p>
          </>
        ) : phase?.kind === "choices" ? (
          <>
            <p className="stage-msg big">which word did you see?</p>
            <div className="wb-choices">
              {phase.choices.map((c) => (
                <button key={c} className="wb-choice" onClick={() => answer(c === phase.word)}>
                  {c}
                </button>
              ))}
            </div>
          </>
        ) : phase?.kind === "stroop" ? (
          <>
            <p className="eyebrow">click the INK color, not the word</p>
            <div className="wb-word" style={{ color: phase.ink.hex }}>
              {phase.word.name}
            </div>
            <div className="wb-swatches">
              {phase.swatches.map((c) => (
                <button key={c.name} className="wb-swatch" style={{ background: c.hex }} aria-label={c.name} onClick={() => answer(c.hex === phase.ink.hex)} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
