import { useCallback, useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { useNoScroll } from "../hooks/useNoScroll.js";

// Visual Cortex — a random-dot kinematogram (RDK), the standard test of global
// motion perception. A cloud of dots: some fraction drift together in one of
// four directions, the rest scatter at random. Call the drift direction.
//
// Coherence (the fraction moving together) is what makes it hard, and it runs a
// staircase: big drops on every hit until your first miss, then 2-down-1-up —
// two right in a row makes it harder, one wrong makes it easier. That converges
// on the coherence you're right about ~71% of the time: your motion threshold,
// the number the literature actually reports (healthy adults land around 5-15%).
//
// The coarse opening phase matters. Simulated against a Weibull observer, a
// plain 2-down-1-up from 55% almost never reached two staircase reversals inside
// one session for a sharp observer, so the readout fell back on wherever the run
// happened to stop and over-reported the threshold by half again. Coarse-then-
// fine lands within a few percent of the true value at every level tested.
//
// Why this and not another Flash Focus: orientation is a V1 job, but global
// motion is pooled in V5/MT, fed by the pericalcarine and lateral-occipital
// cortex that came back at the 0.01st and 0.17th percentiles on the scan.
// Nothing else here tests motion at all.
const TOTAL = 26;
const N_DOTS = 170;
const MOTION_MS = 1000;
const RESPOND_MS = 4000;
const DOT_LIFE_MS = 260;
const START_COH = 55;
const MIN_COH = 1.5;
const MAX_COH = 95;
const COARSE = 0.6; // before your first miss: drop fast on every single hit
const DOWN = 0.8; // after it: two right in a row → coherence × this
const UP = 1.35; // one wrong → coherence × this

// screen directions, in the order the arrow pad and the keyboard map them
const DIRS = [
  { id: 0, dx: 1, dy: 0, key: "ArrowRight", glyph: "→", label: "right" },
  { id: 1, dx: 0, dy: -1, key: "ArrowUp", glyph: "↑", label: "up" },
  { id: 2, dx: -1, dy: 0, key: "ArrowLeft", glyph: "←", label: "left" },
  { id: 3, dx: 0, dy: 1, key: "ArrowDown", glyph: "↓", label: "down" },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (n) => Math.floor(Math.random() * n);
const fmt = (v) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

export default function Drift({ onBack, onFinish, best }) {
  useNoScroll();
  const canvasRef = useRef(null);
  const phaseRef = useRef("motion"); // motion | respond | feedback | done
  const dots = useRef([]);
  const raf = useRef(0);
  const timers = useRef([]);
  const eng = useRef(null);

  const [size, setSize] = useState(() => Math.min(420, Math.max(240, (typeof window === "undefined" ? 420 : window.innerWidth) - 48)));
  const [trial, setTrial] = useState(0);
  const [coh, setCoh] = useState(START_COH);
  const [phase, setPhase] = useState("motion");
  const [reveal, setReveal] = useState(null); // { dir, hit } during feedback
  const [msg, setMsg] = useState("which way is the cloud drifting?");
  const [summary, setSummary] = useState(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const onResize = () => setSize(Math.min(420, Math.max(240, window.innerWidth - 48)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ---- dot field -----------------------------------------------------------
  // Dots live in a circular aperture in unit coordinates (-1..1), so a resize
  // never disturbs a run in progress.
  const seedDots = useCallback(() => {
    dots.current = Array.from({ length: N_DOTS }, () => spawn(Math.random() * DOT_LIFE_MS));
  }, []);

  function spawn(life = DOT_LIFE_MS) {
    // uniform over the disc: sqrt keeps the density even instead of clumping at the middle
    const r = Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    return { x: r * Math.cos(a), y: r * Math.sin(a), life };
  }

  // ---- the animation loop --------------------------------------------------
  useEffect(() => {
    if (summary) return; // canvas is unmounted behind the results card
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let last = performance.now();

    const frame = (t) => {
      raf.current = requestAnimationFrame(frame);
      const dt = Math.min(50, t - last); // a backgrounded tab shouldn't teleport the field
      last = t;
      const dpr = window.devicePixelRatio || 1;
      const px = size * dpr;
      if (canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      const R = px / 2 - 4 * dpr;
      const cx = px / 2;
      const cy = px / 2;

      ctx.clearRect(0, 0, px, px);
      ctx.fillStyle = "#0a1210";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      const moving = phaseRef.current === "motion";
      if (moving) {
        const e = eng.current;
        const signal = DIRS[e.dir];
        const step = (0.55 * dt) / 1000; // ~0.55 aperture-radii per second
        const p = e.coh / 100;
        for (const d of dots.current) {
          d.life -= dt;
          if (d.life <= 0) {
            Object.assign(d, spawn());
            continue;
          }
          // Re-rolled every frame (the Brownian RDK variant): no single dot can
          // be tracked to the answer, so you have to pool across the field.
          if (Math.random() < p) {
            d.x += signal.dx * step;
            d.y += signal.dy * step;
          } else {
            const a = Math.random() * Math.PI * 2;
            d.x += Math.cos(a) * step;
            d.y += Math.sin(a) * step;
          }
          if (d.x * d.x + d.y * d.y > 1) Object.assign(d, spawn());
        }
      }

      if (moving) {
        ctx.fillStyle = "#eaf3ee";
        const rad = Math.max(1.4, 2 * dpr);
        for (const d of dots.current) {
          ctx.beginPath();
          ctx.arc(cx + d.x * R, cy + d.y * R, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [size, summary]);

  // ---- trial flow ----------------------------------------------------------
  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const finish = useCallback(() => {
    const e = eng.current;
    setPhaseBoth("done");
    clearTimers();
    // Threshold = geometric mean of the last reversals, the standard readout of
    // a staircase. Too few reversals to average → fall back to where it landed.
    const rv = e.reversals;
    const tail = rv.slice(-4);
    const threshold = tail.length >= 2 ? Math.exp(tail.reduce((s, v) => s + Math.log(v), 0) / tail.length) : e.coh;
    const acc = Math.round((e.correct / TOTAL) * 100);
    const xpEarned = 20 + e.correct * 5 + Math.max(0, Math.round(55 - threshold));
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        bestThreshold: Math.min(prev.bestThreshold, Math.round(threshold * 10) / 10),
        minCoherence: Math.min(prev.minCoherence, Math.round(e.minCorrect * 10) / 10),
        accuracy: Math.max(prev.accuracy, acc),
        plays: prev.plays + 1,
      }),
    });
    setSummary({ threshold, acc, minCorrect: e.minCorrect, xpEarned });
  }, [onFinish]);

  const startTrial = useCallback(() => {
    clearTimers();
    const e = eng.current;
    if (e.trial >= TOTAL) return finish();
    e.trial++;
    e.dir = rnd(4);
    e.answered = false;
    setTrial(e.trial);
    setCoh(e.coh);
    setReveal(null);
    seedDots();
    setMsg("watch…");
    setPhaseBoth("motion");
    timers.current.push(
      setTimeout(() => {
        setPhaseBoth("respond");
        setMsg("call it — arrow keys or the pad");
        timers.current.push(
          setTimeout(() => {
            if (!e.answered) answer(null);
          }, RESPOND_MS)
        );
      }, MOTION_MS)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish, seedDots]);

  const answer = useCallback(
    (guess) => {
      const e = eng.current;
      if (e.answered) return;
      e.answered = true;
      clearTimers();
      const hit = guess === e.dir;
      const before = e.coh;

      if (hit) {
        e.correct++;
        e.minCorrect = Math.min(e.minCorrect, before);
        if (e.coarse) {
          // homing in — no need to be right twice yet
          e.coh = clamp(e.coh * COARSE, MIN_COH, MAX_COH);
        } else {
          e.run++;
          if (e.run >= 2) {
            e.run = 0;
            e.coh = clamp(e.coh * DOWN, MIN_COH, MAX_COH);
          }
        }
      } else {
        e.coarse = false; // first miss ends the coarse phase for the rest of the run
        e.run = 0;
        e.coh = clamp(e.coh * UP, MIN_COH, MAX_COH);
      }

      // a reversal is where the staircase changes direction — those are the
      // points that bracket the threshold
      if (e.coh !== before) {
        const dirOfChange = e.coh < before ? "down" : "up";
        if (e.lastChange && e.lastChange !== dirOfChange) e.reversals.push(before);
        e.lastChange = dirOfChange;
      }

      setReveal({ dir: e.dir, hit });
      setPhaseBoth("feedback");
      setMsg(hit ? `✅ ${DIRS[e.dir].label} — at ${fmt(before)}% coherence` : guess == null ? `⏱ too slow — it was ${DIRS[e.dir].label}` : `✕ it was ${DIRS[e.dir].label}`);
      timers.current.push(setTimeout(startTrial, 700));
    },
    [startTrial]
  );

  useEffect(() => {
    const onKey = (ev) => {
      const d = DIRS.find((x) => x.key === ev.key);
      if (!d) return;
      ev.preventDefault();
      if (phaseRef.current === "respond") answer(d.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  const start = useCallback(() => {
    eng.current = { trial: 0, correct: 0, coh: START_COH, dir: 0, run: 0, coarse: true, reversals: [], lastChange: null, minCorrect: 999, answered: false };
    setSummary(null);
    startTrial();
  }, [startTrial]);

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bestTxt = best.bestThreshold < 999 ? `${fmt(best.bestThreshold)}%` : "—";

  return (
    <>
      <GameHeader color="var(--visual)" regionLabel="Visual Cortex · Drift" title="Drift" onBack={onBack}>
        <span className="stat-pill">
          Trial{" "}
          <b className="mono">
            {trial}/{TOTAL}
          </b>
        </span>
        <span className="stat-pill">
          Coherence <b className="mono">{fmt(coh)}%</b>
        </span>
        <span className="stat-pill">
          Best threshold <b className="mono">{bestTxt}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="motion threshold"
            bigNum={`${fmt(summary.threshold)}%`}
            detail={`coherence you can still read · ${summary.acc}% correct over ${TOTAL} trials${
              summary.minCorrect < 999 ? ` · faintest drift you caught was ${fmt(summary.minCorrect)}%` : ""
            } · +${summary.xpEarned} xp to Visual Cortex`}
            onAgain={start}
            onBack={onBack}
          >
            <p className="stage-msg" style={{ maxWidth: "48ch" }}>
              Healthy adults usually land somewhere around 5–15% on translational global motion. Lower is sharper.
            </p>
          </SessionSummary>
        ) : (
          <>
            <div className="dr-aperture" style={{ width: size, height: size }}>
              <canvas ref={canvasRef} style={{ width: size, height: size }} />
              {phase !== "motion" && <div className="dr-fixation" />}
              {reveal && (
                <div className={`dr-reveal ${reveal.hit ? "hit" : "miss"}`} style={{ transform: `rotate(${[0, -90, 180, 90][reveal.dir]}deg)` }}>
                  →
                </div>
              )}
            </div>

            <p className="stage-msg big">{msg}</p>

            <div className="dr-pad">
              {DIRS.map((d) => (
                <button
                  key={d.id}
                  className={`dr-key dr-key--${d.label}`}
                  disabled={phase !== "respond"}
                  onClick={() => answer(d.id)}
                  aria-label={d.label}
                >
                  {d.glyph}
                </button>
              ))}
            </div>

            <p className="stage-msg">
              Most of the dots are noise. Don't chase one — let the whole cloud tell you. Every right call makes the drift fainter; after your first miss it takes two in a row.
            </p>
          </>
        )}
      </div>
    </>
  );
}
