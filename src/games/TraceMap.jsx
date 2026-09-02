import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import HoldBar from "../components/HoldBar.jsx";
import { cheer } from "../data/praise.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
const range = (n) => Array.from({ length: n }, (_, i) => i);
const GRID_N = 16;
const TOTAL = 8;
const ICONS = [
  { g: "★", c: "var(--hippocampus)" }, { g: "●", c: "var(--visual)" }, { g: "▲", c: "var(--auditory)" },
  { g: "◆", c: "var(--motor)" }, { g: "■", c: "var(--wordform)" }, { g: "✦", c: "var(--amber)" },
  { g: "♥", c: "#e6626e" }, { g: "☀", c: "#eaf3ee" },
];

// Hippocampus — spatial paired-associate memory (the real Paired Associates
// Learning task format). Shapes flash at grid positions, you hold them through
// a growing delay with zero rehearsal, then tap-to-place-or-swap them back —
// nothing is graded until you hit Submit.
export default function TraceMap({ onBack, onFinish }) {
  const eng = useRef({ round: 0, itemCount: 3, delayMs: 1200, exposure: 1000, accSum: 0, goodStreak: 0, roundCells: [], roundIcons: [] });
  const timers = useRef([]);
  const [uiRound, setUiRound] = useState(0);
  const [uiItems, setUiItems] = useState(3);
  const [phase, setPhase] = useState("memorize"); // memorize | hold | recall | result | summary
  const [cellContent, setCellContent] = useState({});
  const [iconLocation, setIconLocation] = useState({});
  const [selectedSource, setSelectedSource] = useState(null);
  const [resultCorrect, setResultCorrect] = useState({});
  const [msg, setMsg] = useState("memorize the positions…");
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
    e.exposure = clamp(800 + e.itemCount * 500, 800, 4000); // generous on purpose — the drill is the delayed recall, not a speed-read of the board
    e.roundCells = shuffle(range(GRID_N)).slice(0, e.itemCount);
    e.roundIcons = shuffle(ICONS.slice()).slice(0, e.itemCount);
    setUiItems(e.itemCount);
    setCellContent({});
    const loc = {};
    for (let k = 0; k < e.itemCount; k++) loc[k] = "tray";
    setIconLocation(loc);
    setSelectedSource(null);
    setResultCorrect({});
    setMsg("memorize the positions…");
    setPhase("memorize");
    timers.current.push(setTimeout(startDelay, e.exposure));
  }

  function startDelay() {
    setMsg("hold it in mind…");
    setPhase("hold");
    timers.current.push(setTimeout(startRecall, eng.current.delayMs));
  }

  function startRecall() {
    setMsg("tap a shape, then a square — tap two placed shapes to swap them");
    setPhase("recall");
  }

  function onTrayTap(i) {
    if (iconLocation[i] !== "tray") return;
    if (selectedSource === null) {
      setSelectedSource({ kind: "tray", icon: i });
    } else if (selectedSource.kind === "tray") {
      setSelectedSource(selectedSource.icon === i ? null : { kind: "tray", icon: i });
    } else if (selectedSource.kind === "cell") {
      const c = selectedSource.idx;
      const prevIcon = cellContent[c];
      setCellContent({ ...cellContent, [c]: i });
      setIconLocation({ ...iconLocation, [i]: c, ...(prevIcon != null ? { [prevIcon]: "tray" } : {}) });
      setSelectedSource(null);
    }
  }

  function onCellTap(idx) {
    if (selectedSource === null) {
      if (cellContent[idx] != null) setSelectedSource({ kind: "cell", idx });
    } else if (selectedSource.kind === "cell") {
      const a = selectedSource.idx;
      if (a === idx) {
        setSelectedSource(null);
      } else {
        const next = { ...cellContent };
        const tmp = next[a];
        if (next[idx] != null) next[a] = next[idx];
        else delete next[a];
        if (tmp != null) next[idx] = tmp;
        else delete next[idx];
        setCellContent(next);
        const loc = { ...iconLocation };
        if (next[a] != null) loc[next[a]] = a;
        if (next[idx] != null) loc[next[idx]] = idx;
        setIconLocation(loc);
        setSelectedSource(null);
      }
    } else if (selectedSource.kind === "tray") {
      const i = selectedSource.icon;
      const existing = cellContent[idx];
      setCellContent({ ...cellContent, [idx]: i });
      setIconLocation({ ...iconLocation, [i]: idx, ...(existing != null ? { [existing]: "tray" } : {}) });
      setSelectedSource(null);
    }
  }

  function submit() {
    const e = eng.current;
    const correctMap = {};
    let correct = 0;
    e.roundCells.forEach((idx, i) => {
      const ok = cellContent[idx] === i;
      correctMap[idx] = ok;
      if (ok) correct++;
    });
    setResultCorrect(correctMap);
    setPhase("result");
    const acc = correct / e.itemCount;
    e.accSum += acc;
    setMsg(`${correct} / ${e.itemCount} correct`);
    if (acc >= 0.8) {
      cheer();
      e.goodStreak++;
      e.delayMs = clamp(e.delayMs + 150, 1000, 4500); // the hold gets longer right away — that's the point of the drill
      if (e.goodStreak >= 2) {
        e.itemCount = clamp(e.itemCount + 1, 3, 8);
        e.goodStreak = 0;
      } // item count only climbs every 2 clean rounds, like Motor Chain's slow ramp
    } else if (acc < 0.4) {
      e.goodStreak = 0;
      e.itemCount = clamp(e.itemCount - 1, 3, 8);
      e.delayMs = clamp(e.delayMs - 200, 1000, 4500);
    } else {
      e.goodStreak = 0;
    }
    timers.current.push(setTimeout(nextRound, 1300));
  }

  function finish() {
    const e = eng.current;
    const avgAcc = Math.round((e.accSum / TOTAL) * 100);
    const xpEarned = 25 + Math.round(avgAcc / 3) + e.itemCount * 4;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        accuracy: Math.max(prev.accuracy, avgAcc),
        maxItems: Math.max(prev.maxItems, e.itemCount),
        plays: prev.plays + 1,
      }),
    });
    setSummary({ avgAcc, itemCount: e.itemCount, xpEarned });
  }

  function start() {
    eng.current = { round: 0, itemCount: 3, delayMs: 1200, exposure: 1000, accSum: 0, goodStreak: 0, roundCells: [], roundIcons: [] };
    setUiRound(0);
    setUiItems(3);
    setSummary(null);
    nextRound();
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filledCount = eng.current ? eng.current.roundCells.filter((idx) => cellContent[idx] != null).length : 0;
  const canSubmit = eng.current && filledCount === eng.current.itemCount;

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Trace Map" title="Trace Map" onBack={onBack}>
        <span className="stat-pill">
          Round{" "}
          <b className="mono">
            {uiRound}/{TOTAL}
          </b>
        </span>
        <span className="stat-pill">
          Items <b className="mono">{uiItems}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="session complete"
            bigNum={`${summary.avgAcc}%`}
            detail={`average recall accuracy over ${TOTAL} rounds · reached ${summary.itemCount} items held · +${summary.xpEarned} xp to Hippocampus`}
            onAgain={start}
            onBack={onBack}
          />
        ) : eng.current ? (
          <>
            <div className="tm-grid">
              {range(GRID_N).map((idx) => {
                const isTarget = eng.current.roundCells.includes(idx);
                const iconIdx = cellContent[idx];
                let cls = "tm-cell";
                if (phase === "memorize" && isTarget) cls += " target";
                if ((phase === "recall" || phase === "result") && isTarget) cls += " slot";
                if ((phase === "recall" || phase === "result") && !isTarget) cls += " dim";
                if (iconIdx != null) cls += " filled";
                if (selectedSource?.kind === "cell" && selectedSource.idx === idx) cls += " selected";
                if (phase === "result" && isTarget) cls += resultCorrect[idx] ? " correct" : " wrong";
                const memIcon = phase === "memorize" && isTarget ? eng.current.roundIcons[eng.current.roundCells.indexOf(idx)] : null;
                const placedIcon = iconIdx != null ? eng.current.roundIcons[iconIdx] : null;
                const showHint = phase === "result" && isTarget && !resultCorrect[idx];
                const hintIcon = showHint ? eng.current.roundIcons[eng.current.roundCells.indexOf(idx)] : null;
                return (
                  <div key={idx} className={cls} onClick={() => (phase === "recall" ? onCellTap(idx) : undefined)}>
                    {memIcon && <span style={{ color: memIcon.c }}>{memIcon.g}</span>}
                    {placedIcon && <span style={{ color: placedIcon.c }}>{placedIcon.g}</span>}
                    {hintIcon && (
                      <span className="tm-correct-hint" style={{ color: hintIcon.c }}>
                        {hintIcon.g}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {phase === "hold" && <HoldBar ms={eng.current.delayMs} />}

            <p className="stage-msg">{msg}</p>

            {phase === "recall" && (
              <>
                <div className="tm-tray">
                  {range(eng.current.itemCount).map((i) => {
                    const used = iconLocation[i] !== "tray";
                    const ic = eng.current.roundIcons[i];
                    return (
                      <button
                        key={i}
                        className={`tm-tray-item${used ? " used" : ""}${selectedSource?.kind === "tray" && selectedSource.icon === i ? " selected" : ""}`}
                        onClick={() => onTrayTap(i)}
                      >
                        <span style={{ color: ic.c }}>{ic.g}</span>
                      </button>
                    );
                  })}
                </div>
                <button className="btn btn--primary" disabled={!canSubmit} onClick={submit}>
                  Submit
                </button>
              </>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
