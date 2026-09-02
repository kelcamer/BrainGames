import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import Landscape from "../components/Landscape.jsx";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (n) => Math.floor(Math.random() * n);
const TOTAL = 8;
const ARC = 80; // landmarks cluster inside this arc so they read as one skyline, not scattered dots
const ROTATION = 50; // how far the camera moves between study and test — fixed; distractor subtlety is the difficulty knob
const COLORS = ["var(--visual)", "var(--auditory)", "var(--motor)", "var(--wordform)", "var(--amber)"];

// Hippocampus — allocentric spatial memory (the Four Mountains Test format).
// Study a skyline from one angle, then recognize the *same arrangement* from
// a rotated viewpoint among decoys that only differ in one landmark's angle.
// There's no color-name or pixel-matching shortcut: the camera moves for
// every option, so you have to hold the actual configuration, not a picture.
export default function FourPeaks({ onBack, onFinish }) {
  const eng = useRef({ round: 0, correct: 0, itemCount: 3, perturb: 55, streak: 0, goodStreak: 0 });
  const timers = useRef([]);
  const [uiRound, setUiRound] = useState(0);
  const [uiStreak, setUiStreak] = useState(0);
  const [phase, setPhase] = useState("study"); // study | choose | feedback | summary
  const [study, setStudy] = useState(null); // { landmarks, angle }
  const [choices, setChoices] = useState([]); // [{ landmarks, angle, isCorrect }]
  const [pickedIdx, setPickedIdx] = useState(null);
  const [msg, setMsg] = useState("study the skyline…");
  const [summary, setSummary] = useState(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  // Landmarks cluster inside a compact arc around baseAngle — a coherent
  // "one skyline" shape — rather than being scattered anywhere on the full
  // circle. Critically, the camera (studyAngle) is pointed AT that same
  // baseAngle, so the study view actually shows the mountains instead of
  // a viewpoint that happens to be looking at empty sky.
  function makeLandmarks(n, baseAngle) {
    const minSep = ARC / (n + 1);
    const angles = [];
    let guard = 0;
    while (angles.length < n && guard < 500) {
      guard++;
      const a = baseAngle + (Math.random() * ARC - ARC / 2);
      if (angles.every((x) => Math.abs(x - a) > minSep)) angles.push(a);
    }
    return angles.map((angle, i) => ({
      angle,
      height: 0.55 + Math.random() * 0.45,
      dist: 0.6 + Math.random() * 0.4,
      color: COLORS[i % COLORS.length],
    }));
  }

  function nextRound() {
    clearTimers();
    const e = eng.current;
    if (e.round >= TOTAL) return finish();
    e.round++;
    setUiRound(e.round);
    const baseAngle = rnd(360);
    const landmarks = makeLandmarks(e.itemCount, baseAngle);
    const studyAngle = baseAngle;
    const testAngle = studyAngle + (rnd(2) ? 1 : -1) * ROTATION;
    const jitter = () => rnd(13) - 6;

    const correctChoice = { landmarks, angle: testAngle + jitter(), isCorrect: true };
    const distractors = Array.from({ length: 3 }, () => {
      const clone = landmarks.map((l) => ({ ...l }));
      const idx = rnd(clone.length);
      clone[idx] = { ...clone[idx], angle: clone[idx].angle + (rnd(2) ? 1 : -1) * e.perturb };
      return { landmarks: clone, angle: testAngle + jitter(), isCorrect: false };
    });
    const all = [correctChoice, ...distractors].sort(() => Math.random() - 0.5);

    setStudy({ landmarks, angle: studyAngle });
    setChoices(all);
    setPickedIdx(null);
    setMsg("study the skyline…");
    setPhase("study");
    timers.current.push(setTimeout(() => {
      setMsg("same skyline, new angle — which one?");
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
      e.perturb = clamp(e.perturb - 6, 15, 70);
      if (e.goodStreak >= 2) {
        e.itemCount = clamp(e.itemCount + 1, 3, 5);
        e.goodStreak = 0;
      }
    } else {
      e.streak = 0;
      e.goodStreak = 0;
      setUiStreak(0);
      e.perturb = clamp(e.perturb + 10, 15, 70);
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
    eng.current = { round: 0, correct: 0, itemCount: 3, perturb: 55, streak: 0, goodStreak: 0 };
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
            {phase === "study" && study && <Landscape landmarks={study.landmarks} viewAngle={study.angle} size="big" />}
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
                      <Landscape landmarks={c.landmarks} viewAngle={c.angle} size="small" />
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
