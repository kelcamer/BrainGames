import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import Landscape, { Z_MAX } from "../components/Landscape.jsx";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (n) => Math.floor(Math.random() * n);
const TOTAL = 8;
const X_RANGE = 0.9; // landmarks placed within [-X_RANGE, X_RANGE] world units
const LATERAL_SHIFT = 1.3; // how far the camera steps sideways between study and test — large relative to
// CAM_Z's closeness in Landscape.jsx so most rounds genuinely reorder the landmarks (verified ~75% do)
const COLORS = ["var(--visual)", "var(--auditory)", "var(--motor)", "var(--wordform)", "var(--amber)"];

// Hippocampus — allocentric spatial memory (the Four Mountains Test format).
// Study a skyline, then recognize the *same 3D arrangement* from a laterally
// shifted camera position among decoys that only differ in one landmark's
// position. Each landmark has real depth (z), so the camera shift causes
// genuine motion parallax — near landmarks sweep across the frame faster
// than far ones — which is what actually forces you to hold the real
// arrangement in memory instead of a flat picture. (An earlier version only
// panned the camera around a fixed-radius ring, which shifts every landmark
// by the same amount and changes nothing about their relative order — that
// could be solved by memorizing the silhouette alone, which is exactly what
// happened.)
export default function FourPeaks({ onBack, onFinish }) {
  const eng = useRef({ round: 0, correct: 0, itemCount: 3, perturb: 0.4, streak: 0, goodStreak: 0 });
  const timers = useRef([]);
  const [uiRound, setUiRound] = useState(0);
  const [uiStreak, setUiStreak] = useState(0);
  const [phase, setPhase] = useState("study"); // study | choose | feedback | summary
  const [study, setStudy] = useState(null); // { landmarks, camX }
  const [choices, setChoices] = useState([]); // [{ landmarks, camX, isCorrect }]
  const [pickedIdx, setPickedIdx] = useState(null);
  const [msg, setMsg] = useState("study the skyline…");
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function makeLandmarks(n) {
    const minSep = (2 * X_RANGE) / (n + 1);
    const xs = [];
    let guard = 0;
    while (xs.length < n && guard < 500) {
      guard++;
      const x = Math.random() * 2 * X_RANGE - X_RANGE;
      if (xs.every((v) => Math.abs(v - x) > minSep)) xs.push(x);
    }
    return xs.map((x, i) => ({
      x,
      z: Math.random() * Z_MAX, // near camera .. far — this depth spread is what makes the shift scramble things for real
      height: 0.55 + Math.random() * 0.45,
      color: COLORS[i % COLORS.length],
    }));
  }

  function nextRound() {
    clearTimers();
    const e = eng.current;
    if (e.round >= TOTAL) return finish();
    e.round++;
    setUiRound(e.round);
    const landmarks = makeLandmarks(e.itemCount);
    const testCamX = (rnd(2) ? 1 : -1) * LATERAL_SHIFT;
    const jitter = () => Math.random() * 0.16 - 0.08;

    const correctChoice = { landmarks, camX: testCamX + jitter(), isCorrect: true };
    const distractors = Array.from({ length: 3 }, () => {
      const clone = landmarks.map((l) => ({ ...l }));
      const idx = rnd(clone.length);
      clone[idx] = { ...clone[idx], x: clamp(clone[idx].x + (rnd(2) ? 1 : -1) * e.perturb, -X_RANGE * 1.3, X_RANGE * 1.3) };
      return { landmarks: clone, camX: testCamX + jitter(), isCorrect: false };
    });
    const all = [correctChoice, ...distractors].sort(() => Math.random() - 0.5);

    setStudy({ landmarks, camX: 0 });
    setChoices(all);
    setPickedIdx(null);
    setMsg("study the skyline…");
    setPhase("study");
    timers.current.push(setTimeout(() => {
      setMsg("same skyline, camera's moved — which one?");
      setPhase("choose");
    }, 3200));
  }

  function answer(idx) {
    const e = eng.current;
    if (phase !== "choose") return;
    const isCorrect = choices[idx].isCorrect;
    setPickedIdx(idx);
    setPhase("feedback");
    if (isCorrect) {
      e.correct++;
      e.streak++;
      e.goodStreak++;
      setUiStreak(e.streak);
      e.perturb = clamp(e.perturb - 0.05, 0.12, 0.65);
      if (e.goodStreak >= 2) {
        e.itemCount = clamp(e.itemCount + 1, 3, 5);
        e.goodStreak = 0;
      }
    } else {
      e.streak = 0;
      e.goodStreak = 0;
      setUiStreak(0);
      e.perturb = clamp(e.perturb + 0.08, 0.12, 0.65);
    }
    timers.current.push(setTimeout(nextRound, 1100));
  }

  function finish() {
    const e = eng.current;
    const acc = Math.round((e.correct / TOTAL) * 100);
    const xpEarned = 20 + e.correct * 10 + e.itemCount * 3;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        accuracy: Math.max(prev.accuracy, acc),
        maxLandmarks: Math.max(prev.maxLandmarks, e.itemCount),
        plays: prev.plays + 1,
      }),
    });
    setSummary({ acc, itemCount: e.itemCount, xpEarned });
  }

  function start() {
    eng.current = { round: 0, correct: 0, itemCount: 3, perturb: 0.4, streak: 0, goodStreak: 0 };
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
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus · Four Peaks" title="Four Peaks" onBack={onBack}>
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
            detail={`accuracy over ${TOTAL} rounds · held ${summary.itemCount} landmarks · +${summary.xpEarned} xp to Hippocampus`}
            onAgain={start}
            onBack={onBack}
          />
        ) : (
          <>
            {phase === "study" && study && <Landscape landmarks={study.landmarks} camX={study.camX} size="big" />}
            {(phase === "choose" || phase === "feedback") && (
              <div className="peaks-choices">
                {choices.map((c, i) => {
                  let cls = "peaks-choice";
                  if (phase === "feedback") {
                    if (c.isCorrect) cls += " correct";
                    else if (i === pickedIdx) cls += " wrong";
                  }
                  return (
                    <button key={i} className={cls} onClick={() => answer(i)} disabled={phase === "feedback"}>
                      <Landscape landmarks={c.landmarks} camX={c.camX} size="small" />
                    </button>
                  );
                })}
              </div>
            )}
            <p className="stage-msg">{msg}</p>
          </>
        )}
      </div>
    </>
  );
}
