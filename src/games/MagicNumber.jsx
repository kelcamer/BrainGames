import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const START_DIGITS = 4;
const SHOW_MS = (len) => 700 + len * 350; // longer numbers get a little longer to read
const BLANK_MS = 2500; // the delay you have to hold the number across

function makeNumber(len) {
  // First digit 1–9 so the string is always exactly `len` digits; rest 0–9.
  let s = String(1 + Math.floor(Math.random() * 9));
  for (let i = 1; i < len; i++) s += String(Math.floor(Math.random() * 10));
  return s;
}

// Hippocampus — forward digit span. A number flashes, the screen blanks for a
// few seconds (the maintenance delay), then you type it back. Each clean recall
// adds one digit. This is the classic forward digit-span test: the span you
// reach is the length you held through the blank, and average adult span is ~7.
export default function MagicNumber({ onBack, onFinish, best }) {
  const eng = useRef({ len: START_DIGITS, target: "", achievedSpan: 0 });
  const timers = useRef([]);
  const inputRef = useRef(null);
  const [phase, setPhase] = useState("show"); // show | blank | recall | result | summary
  const [shownLen, setShownLen] = useState(START_DIGITS);
  const [entry, setEntry] = useState("");
  const [result, setResult] = useState(null); // { correct, target }
  const [msg, setMsg] = useState("memorize the number…");
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function nextRound() {
    clearTimers();
    const e = eng.current;
    e.target = makeNumber(e.len);
    setShownLen(e.len);
    setEntry("");
    setResult(null);
    setPhase("show");
    setMsg(`memorize the number… (${e.len} digits)`);
    timers.current.push(
      setTimeout(() => {
        setPhase("blank");
        setMsg("hold it…");
        timers.current.push(
          setTimeout(() => {
            setPhase("recall");
            setMsg("type the number, then submit");
          }, BLANK_MS)
        );
      }, SHOW_MS(e.len))
    );
  }

  // Focus the field the moment the recall phase opens.
  useEffect(() => {
    if (phase === "recall" && inputRef.current) inputRef.current.focus();
  }, [phase]);

  function submit() {
    const e = eng.current;
    const correct = entry === e.target;
    setResult({ correct, target: e.target });
    setPhase("result");
    if (correct) {
      e.achievedSpan = e.len;
      setMsg("correct — one more digit");
      timers.current.push(
        setTimeout(() => {
          e.len += 1;
          nextRound();
        }, 1300)
      );
    } else {
      setMsg("not quite — run over");
      timers.current.push(setTimeout(finish, 1800));
    }
  }

  function finish() {
    const achieved = eng.current.achievedSpan;
    const xpEarned = 15 + achieved * 12;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ maxSpan: Math.max(prev.maxSpan, achieved), plays: prev.plays + 1 }),
    });
    setSummary({ achieved, xpEarned });
  }

  function start() {
    eng.current = { len: START_DIGITS, target: "", achievedSpan: 0 };
    setSummary(null);
    nextRound();
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKeyDown(ev) {
    if (ev.key === "Enter" && entry.length > 0) submit();
  }

  const e = eng.current;
  const canSubmit = phase === "recall" && entry.length > 0;

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Magic Number" title="Magic Number" onBack={onBack}>
        <span className="stat-pill">
          Digits <b className="mono">{shownLen}</b>
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
            detail={`digits held through the delay, at your best · +${summary.xpEarned} xp to Hippocampus`}
            onAgain={start}
            againLabel="Try Again"
            onBack={onBack}
          />
        ) : (
          <>
            <div className="magic-display">
              {phase === "show" && <span className="magic-number mono">{e.target}</span>}
              {phase === "blank" && <span className="magic-dots">• • •</span>}
              {phase === "recall" && (
                <span className="magic-number mono magic-number--ghost">{"•".repeat(shownLen)}</span>
              )}
              {phase === "result" &&
                (result.correct ? (
                  <span className="magic-number mono magic-number--ok">{result.target}</span>
                ) : (
                  <span className="magic-number mono magic-number--bad">
                    {entry || "—"} <span className="magic-vs">≠ {result.target}</span>
                  </span>
                ))}
            </div>
            <p className="stage-msg">{msg}</p>
            {phase === "recall" && (
              <div className="magic-entry">
                <input
                  ref={inputRef}
                  className="magic-input mono"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={entry}
                  maxLength={shownLen}
                  onChange={(ev) => setEntry(ev.target.value.replace(/\D/g, "").slice(0, shownLen))}
                  onKeyDown={onKeyDown}
                  aria-label="Type the number you saw"
                />
                <button className="btn btn--primary" disabled={!canSubmit} onClick={submit}>
                  Submit
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
