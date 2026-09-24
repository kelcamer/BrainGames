import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { useNoScroll } from "../hooks/useNoScroll.js";

// Orbitofrontal cortex — probabilistic reversal learning. Two cards: the good one
// pays off most of the time, the bad one rarely. After a run of good picks the
// payoffs swap without warning. The measure is how fast you let go of the old
// winner once it stops paying: perseverative errors per reversal.
//
// Why this task: the reversal is the part that needs orbitofrontal cortex.
// Patients with ventromedial/orbitofrontal damage learn the first rule fine but
// keep choosing the old card after the swap (Fellows & Farah 2003,
// doi:10.1093/brain/awg180); in healthy people the lateral orbitofrontal /
// ventrolateral PFC responds on the error that triggers the switch (Cools et al.
// 2002, doi:10.1523/JNEUROSCI.22-11-04563.2002; O'Doherty et al. 2001,
// doi:10.1038/82959). Left lateral orbitofrontal is the 12th percentile on the scan.
//
// Why probabilistic, not 100/0: with certain payoffs one loss is proof and the
// swap is trivial. With 80/20, one loss is noise — you have to weigh evidence
// before switching, which is the actual orbitofrontal computation.

const TOTAL = 60;
const PAYOFF = [0.9, 0.85, 0.8, 0.75, 0.7]; // good card's payoff rate, by level
const LEVEL_UP_REVERSALS = 5;
const PAIRS = [
  ["🍋", "🫐"],
  ["🌙", "☀️"],
  ["🍄", "🌵"],
  ["🐚", "🪶"],
  ["🔔", "🎈"],
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const newCriterion = () => 6 + Math.floor(Math.random() * 4); // 6-9 good picks in a row

function freshEngine(level) {
  return {
    level,
    payoff: PAYOFF[level],
    pair: pick(PAIRS),
    good: Math.random() < 0.5 ? 0 : 1, // index into pair
    trial: 0,
    correct: 0,
    points: 0,
    streak: 0,
    criterion: newCriterion(),
    reversals: 0,
    counting: false, // true from a reversal until the first pick of the new good card
    persevNow: 0,
    persev: [], // perseverative errors for each completed reversal
    leftIsZero: true,
  };
}

export default function Switchback({ onBack, onFinish, best }) {
  useNoScroll();
  const level = Math.min(best.level || 0, PAYOFF.length - 1);
  const eng = useRef(freshEngine(level));
  const busy = useRef(false);
  const timer = useRef(null);
  const [, force] = useState(0);
  const [feedback, setFeedback] = useState(null); // { win, side }
  const [summary, setSummary] = useState(null);

  const rerender = () => force((n) => n + 1);

  function nextTrial() {
    const e = eng.current;
    e.leftIsZero = Math.random() < 0.5; // shuffle sides so it's the card, not the side
    busy.current = false;
    setFeedback(null);
    rerender();
  }

  function choose(side) {
    const e = eng.current;
    if (busy.current || summary) return;
    busy.current = true;
    const idx = side === "left" ? (e.leftIsZero ? 0 : 1) : e.leftIsZero ? 1 : 0;
    const isGood = idx === e.good;
    const win = Math.random() < (isGood ? e.payoff : 1 - e.payoff);

    e.trial += 1;
    e.points += win ? 10 : -10;
    if (isGood) {
      e.correct += 1;
      e.streak += 1;
      if (e.counting) {
        e.persev.push(e.persevNow);
        e.counting = false;
      }
    } else {
      e.streak = 0;
      if (e.counting) e.persevNow += 1;
    }

    // Silent reversal once you've clearly locked on.
    if (e.streak >= e.criterion) {
      e.good = 1 - e.good;
      e.reversals += 1;
      e.streak = 0;
      e.criterion = newCriterion();
      e.counting = true;
      e.persevNow = 0;
    }

    setFeedback({ win, side });
    timer.current = setTimeout(() => (e.trial >= TOTAL ? finish() : nextTrial()), 650);
  }

  function finish() {
    const e = eng.current;
    const avgPersev = e.persev.length ? e.persev.reduce((a, b) => a + b, 0) / e.persev.length : null;
    const leveledUp = e.reversals >= LEVEL_UP_REVERSALS && e.level < PAYOFF.length - 1;
    const xpEarned = 10 + e.correct + e.reversals * 12;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        maxReversals: Math.max(prev.maxReversals, e.reversals),
        bestPersev: avgPersev === null ? prev.bestPersev : Math.min(prev.bestPersev, Math.round(avgPersev * 10) / 10),
        level: leveledUp ? e.level + 1 : prev.level || 0,
        plays: prev.plays + 1,
      }),
    });
    setSummary({ reversals: e.reversals, avgPersev, acc: Math.round((e.correct / TOTAL) * 100), points: e.points, leveledUp, xpEarned, level: e.level });
  }

  function start() {
    clearTimeout(timer.current);
    eng.current = freshEngine(Math.min(best.level || 0, PAYOFF.length - 1));
    setSummary(null);
    nextTrial();
  }

  useEffect(() => {
    nextTrial();
    const onKey = (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "1") choose("left");
      else if (ev.key === "ArrowRight" || ev.key === "2") choose("right");
      else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  const e = eng.current;
  const left = e.pair[e.leftIsZero ? 0 : 1];
  const right = e.pair[e.leftIsZero ? 1 : 0];

  return (
    <>
      <GameHeader color="var(--orbitofrontal)" regionLabel="Orbitofrontal Cortex · Switchback" title="Switchback" onBack={onBack}>
        <span className="stat-pill">
          Trial <b className="mono">{Math.min(e.trial + (summary ? 0 : 1), TOTAL)}/{TOTAL}</b>
        </span>
        <span className="stat-pill">
          Points <b className="mono">{e.points}</b>
        </span>
        <span className="stat-pill">
          Level <b className="mono">{level + 1}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={`${summary.reversals} reversal${summary.reversals === 1 ? "" : "s"}`}
            detail={
              `${summary.avgPersev === null ? "no completed switch this run" : `${summary.avgPersev.toFixed(1)} picks of the old winner before switching, on average`}` +
              ` · ${summary.acc}% picks of the better card · good card paid ${Math.round(PAYOFF[summary.level] * 100)}% · +${summary.xpEarned} xp to Orbitofrontal Cortex` +
              (summary.leveledUp ? ` · level up: the good card pays ${Math.round(PAYOFF[summary.level + 1] * 100)}% next time` : "")
            }
            onAgain={start}
            onBack={onBack}
          >
            <p className="stage-msg">
              Fewer picks of the old winner = faster switching. Best so far: <b className="mono">{best.bestPersev < 999 ? best.bestPersev : "—"}</b> · most reversals:{" "}
              <b className="mono">{best.maxReversals}</b>
            </p>
          </SessionSummary>
        ) : (
          <>
            <div className="sb-cards">
              {[
                ["left", left],
                ["right", right],
              ].map(([side, sym]) => (
                <button
                  key={side}
                  className={"sb-card" + (feedback && feedback.side === side ? (feedback.win ? " sb-win" : " sb-lose") : "")}
                  onPointerDown={(ev) => {
                    ev.preventDefault();
                    choose(side);
                  }}
                  aria-label={`pick the ${side} card`}
                >
                  <span className="sb-sym">{sym}</span>
                </button>
              ))}
            </div>
            <div className={"sb-result mono" + (feedback ? (feedback.win ? " win" : " lose") : "")}>{feedback ? (feedback.win ? "+10" : "−10") : " "}</div>
            <p className="stage-msg">
              One card pays off <b>most</b> of the time. A single loss doesn't mean much — but at some point the cards <b style={{ color: "var(--orbitofrontal)" }}>quietly swap</b>. ← / → or tap.
            </p>
          </>
        )}
      </div>
    </>
  );
}
