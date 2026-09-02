import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const DIRS = ["up", "right", "down", "left"];
const ARROWS = { up: "↑", right: "→", down: "↓", left: "←" };
const TOTAL_SEQ = 5;
const REPS = 4;
const KEYMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

// Putamen — motor sequence learning. Watch a directional chain, then reproduce
// it from memory 4 times in a row with no re-preview. The reaction-time chart
// is the automatization curve: same sequence getting faster with pure repetition.
export default function MotorChain({ onBack, onFinish }) {
  const eng = useRef({ seqNum: 0, seqLen: 4, rep: 0, sequence: [], inputPos: 0, repStart: 0, awaitingInput: false, repTimes: [] });
  const timers = useRef([]);
  const [seqNum, setSeqNum] = useState(0);
  const [rep, setRep] = useState(0);
  const [lit, setLit] = useState(null);
  const [wrongPad, setWrongPad] = useState(null);
  const [msg, setMsg] = useState("memorize the sequence…");
  const [repTimes, setRepTimes] = useState([]);
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function litPad(dir, ms) {
    setLit(dir);
    timers.current.push(setTimeout(() => setLit((cur) => (cur === dir ? null : cur)), ms || 300));
  }

  function previewSequence() {
    const e = eng.current;
    e.awaitingInput = false;
    setWrongPad(null); // clear the slip highlight before replaying — otherwise it fights the .lit class through the whole preview
    let i = 0;
    function step() {
      if (i >= e.sequence.length) {
        e.inputPos = 0;
        e.awaitingInput = true;
        e.repStart = performance.now();
        setMsg(`your turn — rep ${e.rep + 1}/${REPS}`);
        return;
      }
      litPad(e.sequence[i], 340);
      i++;
      timers.current.push(setTimeout(step, 430));
    }
    timers.current.push(setTimeout(step, 400));
  }

  function nextSequence() {
    const e = eng.current;
    if (e.seqNum >= TOTAL_SEQ) return finish();
    e.seqNum++;
    e.rep = 0;
    e.repTimes = [];
    e.sequence = Array.from({ length: e.seqLen }, () => pick(DIRS));
    e.inputPos = 0;
    setSeqNum(e.seqNum);
    setRep(0);
    setRepTimes([]);
    setWrongPad(null);
    setMsg("memorize the sequence…");
    previewSequence();
  }

  function handleInput(dir) {
    const e = eng.current;
    if (!e.awaitingInput) return;
    litPad(dir, 180);
    if (e.sequence[e.inputPos] === dir) {
      e.inputPos++;
      if (e.inputPos >= e.sequence.length) {
        e.awaitingInput = false;
        const t = performance.now() - e.repStart;
        e.repTimes.push(t);
        setRepTimes([...e.repTimes]);
        e.rep++;
        setRep(e.rep);
        if (e.rep >= REPS) {
          timers.current.push(
            setTimeout(() => {
              e.seqLen = clamp(e.seqLen + 1, 4, 8);
              nextSequence();
            }, 700)
          );
        } else {
          // re-arm immediately, no dead window — a fast player's next press would otherwise
          // land while input is still ignored and get silently dropped, throwing the count off by one
          e.inputPos = 0;
          e.awaitingInput = true;
          e.repStart = performance.now();
          setMsg(`again — rep ${e.rep + 1}/${REPS} (no preview this time)`);
        }
      }
    } else {
      e.awaitingInput = false;
      setWrongPad(dir);
      setMsg("slip — replaying sequence");
      timers.current.push(setTimeout(previewSequence, 700));
    }
  }

  function onKey(e) {
    const dir = KEYMAP[e.key];
    if (!dir) return;
    e.preventDefault(); // stop the browser's native page-scroll on arrow keys
    if (e.repeat) return; // ignore OS key-auto-repeat from a held key — only count real presses
    handleInput(dir);
  }

  function finish() {
    const e = eng.current;
    let gainPct = 0;
    if (e.repTimes.length >= 2) {
      const first = e.repTimes[0];
      const last = e.repTimes[e.repTimes.length - 1];
      gainPct = Math.round(((first - last) / first) * 100);
    }
    const xpEarned = 30 + e.seqLen * 6 + clamp(gainPct, 0, 60);
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        maxSeqLen: Math.max(prev.maxSeqLen, e.seqLen),
        bestGainPct: Math.max(prev.bestGainPct, gainPct),
        plays: prev.plays + 1,
      }),
    });
    setSummary({ gainPct, seqLen: e.seqLen, xpEarned });
  }

  function start() {
    eng.current = { seqNum: 0, seqLen: 4, rep: 0, sequence: [], inputPos: 0, repStart: 0, awaitingInput: false, repTimes: [] };
    setSeqNum(0);
    setRep(0);
    setRepTimes([]);
    setSummary(null);
    nextSequence();
  }

  useEffect(() => {
    start();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimers();
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxT = Math.max(...repTimes, 600);

  return (
    <>
      <GameHeader color="var(--motor)" regionLabel="Putamen · Motor Chain" title="Motor Chain" onBack={onBack}>
        <span className="stat-pill">
          Sequence{" "}
          <b className="mono">
            {seqNum}/{TOTAL_SEQ}
          </b>
        </span>
        <span className="stat-pill">
          Rep{" "}
          <b className="mono">
            {rep}/{REPS}
          </b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="chain complete"
            bigNum={`${summary.gainPct > 0 ? "+" : ""}${summary.gainPct}%`}
            detail={`faster on the last rep than the first · reached sequence length ${summary.seqLen} · +${summary.xpEarned} xp to Putamen`}
            onAgain={start}
            againLabel="Run Again"
            onBack={onBack}
          />
        ) : (
          <>
            <p className="stage-msg">{msg}</p>
            <div className="mc-pad-grid">
              {DIRS.map((dir) => (
                <div
                  key={dir}
                  className={`mc-pad ${dir} ${lit === dir ? "lit" : ""} ${wrongPad === dir ? "wrong" : ""}`}
                  onClick={() => handleInput(dir)}
                >
                  {ARROWS[dir]}
                </div>
              ))}
            </div>
            <div className="mc-chart">
              {repTimes.map((t, i) => (
                <div className="bar-wrap" key={i}>
                  <div className="bar" style={{ height: `${clamp((t / maxT) * 100, 6, 100)}%` }} />
                  <div className="bar-label">
                    rep {i + 1}
                    <br />
                    {Math.round(t)}ms
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
