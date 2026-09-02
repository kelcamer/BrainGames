import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

const LETTERS = "CHKLQRSTWXYZ".split("");
const STREAM = 16; // letters per round
const rnd = (n) => Math.floor(Math.random() * n);

// Prefrontal Executive Network — N-back working memory. Letters stream by one
// at a time; press MATCH when the current letter is the same as the one N steps
// back. Clear a round cleanly and N climbs. The canonical dorsolateral-PFC
// working-memory task.
export default function NBack({ onBack, onFinish, best }) {
  const eng = useRef({ n: 1, seq: [], pos: -1, responded: false, hits: 0, fa: 0, misses: 0, targets: 0, bestN: 0 });
  const timers = useRef([]);
  const [letter, setLetter] = useState("");
  const [flash, setFlash] = useState(null); // hit | fa | miss
  const [n, setN] = useState(1);
  const [phase, setPhase] = useState("play");
  const [summary, setSummary] = useState(null);
  const [msg, setMsg] = useState("");

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function buildSeq(nb) {
    // ~30% of eligible positions are real N-back matches
    const seq = [];
    for (let i = 0; i < STREAM; i++) {
      if (i >= nb && Math.random() < 0.3) seq.push(seq[i - nb]);
      else {
        let c = LETTERS[rnd(LETTERS.length)];
        if (i >= nb && c === seq[i - nb]) c = LETTERS[(LETTERS.indexOf(c) + 1) % LETTERS.length];
        seq.push(c);
      }
    }
    return seq;
  }

  function startRound() {
    clearTimers();
    const e = eng.current;
    e.seq = buildSeq(e.n);
    e.pos = -1;
    e.hits = e.fa = e.misses = 0;
    e.targets = e.seq.filter((c, i) => i >= e.n && c === e.seq[i - e.n]).length;
    setN(e.n);
    setMsg(`${e.n}-back — press MATCH when the letter equals ${e.n} step${e.n > 1 ? "s" : ""} back`);
    step();
  }

  function step() {
    const e = eng.current;
    // judge the previous letter if it was an unanswered target
    if (e.pos >= 0) {
      const wasTarget = e.pos >= e.n && e.seq[e.pos] === e.seq[e.pos - e.n];
      if (wasTarget && !e.responded) e.misses += 1;
    }
    e.pos += 1;
    if (e.pos >= e.seq.length) return endRound();
    e.responded = false;
    setFlash(null);
    setLetter(e.seq[e.pos]);
    timers.current.push(setTimeout(() => setLetter(""), 900)); // blank between
    timers.current.push(setTimeout(step, 1600));
  }

  function match() {
    const e = eng.current;
    if (phase !== "play" || e.pos < 0 || e.responded || letter === "") return;
    e.responded = true;
    const isTarget = e.pos >= e.n && e.seq[e.pos] === e.seq[e.pos - e.n];
    if (isTarget) {
      e.hits += 1;
      setFlash("hit");
    } else {
      e.fa += 1;
      setFlash("fa");
    }
  }

  function endRound() {
    const e = eng.current;
    const clean = e.targets > 0 && e.hits === e.targets && e.fa === 0;
    e.bestN = Math.max(e.bestN, e.n);
    if (clean) {
      setMsg(`clean ${e.n}-back! stepping up…`);
      e.n += 1;
      timers.current.push(setTimeout(startRound, 1400));
    } else {
      finish();
    }
  }

  function finish() {
    const achieved = eng.current.bestN;
    const xpEarned = 15 + achieved * 18;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({ maxN: Math.max(prev.maxN, achieved), plays: prev.plays + 1 }),
    });
    setSummary({ achieved, xpEarned });
  }

  function start() {
    eng.current = { n: 1, seq: [], pos: -1, responded: false, hits: 0, fa: 0, misses: 0, targets: 0, bestN: 0 };
    setSummary(null);
    setPhase("play");
    startRound();
  }

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GameHeader color="var(--executive)" regionLabel="Prefrontal Executive Network · N-Back" title="N-Back" onBack={onBack}>
        <span className="stat-pill">
          Level <b className="mono">{n}-back</b>
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.maxN}-back</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={`${summary.achieved}-back`}
            detail={`highest level held cleanly · +${summary.xpEarned} xp to Prefrontal Executive Network`}
            onAgain={start}
            againLabel="Try Again"
            onBack={onBack}
          />
        ) : (
          <>
            <div className={"nb-card" + (flash ? ` nb-${flash}` : "")}>
              <span className="nb-letter mono">{letter || "·"}</span>
            </div>
            <p className="stage-msg">{msg}</p>
            <button className="btn btn--primary" onPointerDown={(ev) => { ev.preventDefault(); match(); }}>
              MATCH
            </button>
          </>
        )}
      </div>
    </>
  );
}
