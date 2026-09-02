import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const TOTAL = 12;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (n) => Math.floor(Math.random() * n);

// Visual Cortex — orientation-discrimination task. Spot the odd-angled tile,
// then recall its position after the bars vanish. Difficulty (exposure time,
// angle delta, grid size) adapts to your streak.
export default function FlashFocus({ onBack, onFinish }) {
  const eng = useRef({ round: 0, streak: 0, correct: 0, exposure: 850, delta: 46, gridSize: 9, oddIndex: 0, answered: false });
  const timers = useRef([]);
  const [uiRound, setUiRound] = useState(0);
  const [uiStreak, setUiStreak] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [visible, setVisible] = useState(true);
  const [clickable, setClickable] = useState(false);
  const [msg, setMsg] = useState("memorize the odd tile…");
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
    const n = e.gridSize;
    const base = rnd(8) * 20;
    const oddIndex = rnd(n);
    e.oddIndex = oddIndex;
    e.answered = false;
    setTiles(
      Array.from({ length: n }, (_, i) => ({
        angle: base + (i === oddIndex ? e.delta * (rnd(2) ? 1 : -1) : 0),
        status: "",
      }))
    );
    setVisible(true);
    setClickable(false);
    setMsg("memorize the odd tile…");
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        setClickable(true);
        setMsg("click where it was");
        timers.current.push(
          setTimeout(() => {
            if (!e.answered) {
              e.answered = true;
              answer(false, null);
            }
          }, 3200)
        );
      }, e.exposure)
    );
  }

  function answer(isCorrect, chosenIdx) {
    const e = eng.current;
    e.answered = true;
    setClickable(false);
    setTiles((prev) =>
      prev.map((t, i) => {
        if (i === e.oddIndex) return { ...t, status: "correct" };
        if (i === chosenIdx && !isCorrect) return { ...t, status: "wrong" };
        return t;
      })
    );
    if (isCorrect) {
      e.correct++;
      e.streak++;
      setUiStreak(e.streak);
      if (e.streak > 0 && e.streak % 6 === 0) e.gridSize = clamp(e.gridSize + (e.gridSize < 16 ? 7 : 0), 9, 16);
      e.exposure = clamp(e.exposure - 30, 160, 900);
      e.delta = clamp(e.delta - 2, 8, 60);
    } else {
      e.streak = 0;
      setUiStreak(0);
      e.exposure = clamp(e.exposure + 40, 160, 900);
      e.delta = clamp(e.delta + 3, 8, 60);
    }
    timers.current.push(setTimeout(nextRound, 700));
  }

  function handleTileClick(i) {
    if (!clickable) return;
    const e = eng.current;
    if (e.answered) return;
    e.answered = true;
    answer(i === e.oddIndex, i);
  }

  function finish() {
    const e = eng.current;
    const acc = Math.round((e.correct / TOTAL) * 100);
    const xpEarned = 20 + e.correct * 8 + Math.round((900 - e.exposure) / 8);
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        accuracy: Math.max(prev.accuracy, acc),
        minExposure: Math.min(prev.minExposure, e.exposure),
        plays: prev.plays + 1,
      }),
    });
    setSummary({ acc, exposure: e.exposure, xpEarned });
  }

  function start() {
    eng.current = { round: 0, streak: 0, correct: 0, exposure: 850, delta: 46, gridSize: 9, oddIndex: 0, answered: false };
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

  const cols = Math.round(Math.sqrt(tiles.length || 9));

  return (
    <>
      <GameHeader color="var(--visual)" regionLabel="Visual Cortex · Flash Focus" title="Flash Focus" onBack={onBack}>
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
            detail={`accuracy over ${TOTAL} rounds · reached ${summary.exposure}ms exposure · +${summary.xpEarned} xp to Visual Cortex`}
            onAgain={start}
            onBack={onBack}
          />
        ) : (
          <>
            <div className="ff-grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
              {tiles.map((t, i) => (
                <div key={i} className={`ff-tile ${clickable ? "clickable" : ""} ${t.status}`} onClick={() => handleTileClick(i)}>
                  <div className="ff-bar" style={{ transform: `rotate(${t.angle}deg)`, visibility: visible ? "visible" : "hidden" }} />
                </div>
              ))}
            </div>
            <p className="stage-msg">{msg}</p>
          </>
        )}
      </div>
    </>
  );
}
