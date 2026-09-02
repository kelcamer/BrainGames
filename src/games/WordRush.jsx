import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const LETTERS = "BCDFGHLMPRST".split(""); // letters with lots of common words
const DURATION = 60; // seconds
const rnd = (n) => Math.floor(Math.random() * n);

// Prefrontal Executive Network — verbal (phonemic) fluency. Given a letter, get
// as many words starting with it as you can in 60s. A classic left inferior
// frontal (Broca's) task; also leans on executive retrieval/self-monitoring.
// No dictionary is bundled, so it counts on the honor system — valid = starts
// with the letter, 2+ letters, not already used.
export default function WordRush({ onBack, onFinish, best }) {
  const [letter, setLetter] = useState("");
  const [entry, setEntry] = useState("");
  const [words, setWords] = useState([]);
  const [left, setLeft] = useState(DURATION);
  const [phase, setPhase] = useState("play");
  const [summary, setSummary] = useState(null);
  const [warn, setWarn] = useState("");
  const tick = useRef(null);
  const inputRef = useRef(null);

  function start() {
    setLetter(LETTERS[rnd(LETTERS.length)]);
    setEntry("");
    setWords([]);
    setLeft(DURATION);
    setWarn("");
    setSummary(null);
    setPhase("play");
  }

  useEffect(() => {
    start();
    return () => clearInterval(tick.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    tick.current = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          clearInterval(tick.current);
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && inputRef.current) inputRef.current.focus();
  }, [phase]);

  function submitWord() {
    const w = entry.trim().toLowerCase();
    setEntry("");
    if (!w) return;
    if (w[0] !== letter.toLowerCase()) return setWarn(`must start with ${letter}`);
    if (w.length < 2) return setWarn("too short");
    if (words.includes(w)) return setWarn("already said that one");
    setWarn("");
    setWords((prev) => [w, ...prev]);
  }

  function finish() {
    const count = words.length;
    const xpEarned = 12 + count * 5;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ bestCount: Math.max(prev.bestCount, count), plays: prev.plays + 1 }),
    });
    setSummary({ count, letter, xpEarned });
    setPhase("summary");
  }

  return (
    <>
      <GameHeader color="var(--executive)" regionLabel="Prefrontal Executive Network · Word Rush" title="Word Rush" onBack={onBack}>
        <span className="stat-pill">
          Time <b className="mono">{left}s</b>
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.bestCount}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="time!"
            bigNum={summary.count}
            detail={`words starting with "${summary.letter}" in 60s · +${summary.xpEarned} xp to Prefrontal Executive Network`}
            onAgain={start}
            againLabel="New Letter"
            onBack={onBack}
          />
        ) : (
          <>
            <p className="stage-msg">as many words as you can starting with</p>
            <div className="wr-letter mono">{letter}</div>
            <div className="magic-entry">
              <input
                ref={inputRef}
                className="magic-input mono"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                value={entry}
                onChange={(ev) => setEntry(ev.target.value.replace(/[^a-zA-Z]/g, ""))}
                onKeyDown={(ev) => ev.key === "Enter" && submitWord()}
                aria-label="type a word"
              />
              <button className="btn btn--primary" onClick={submitWord} disabled={!entry.trim()}>
                Add
              </button>
            </div>
            <p className="stage-msg mono">{warn || `${words.length} so far`}</p>
            <div className="wr-list">
              {words.map((w) => (
                <span key={w} className="wr-chip">
                  {w}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
