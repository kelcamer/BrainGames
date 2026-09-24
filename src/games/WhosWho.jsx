import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";
import { FACES } from "../data/faces.js";

// Left temporal pole — face-name association. Study faces paired with made-up
// first names, at your own pace, then name each face from four options. Lures
// are the other faces' names first (so knowing the set of names isn't enough —
// you have to know which face owns which), always matching the face's sex.
//
// First names only: a first name is as much a proper name as a full one, and
// proper-name retrieval is the temporal pole job. Surnames added arbitrary extra
// load without targeting anything; difficulty now comes from the face count.
//
// Why face -> name and nothing else: people with left temporal pole damage can
// still recognise a familiar face and say what the person does — what they lose
// is the name (Damasio et al. 1996, doi:10.1038/380499a0; Tranel 2009,
// doi:10.1080/02687030802586498). An earlier version also quizzed job and
// hometown, which is the part that survives, so it only diluted the drill.
// Left temporal pole is the 1st percentile on the scan (range 0-6th after the
// conversion uncertainty — low either way).
//
// Study is self-paced: a timer measured reading speed, not memory.
// Starts at 5 faces; every run at 90%+ adds one, up to MAX_PEOPLE.
//
// Faces are AI-generated (thispersonnotexist.org, terms allow reuse), bundled in
// public/faces by scripts/fetch_faces.py. First names are matched to each face.

const FIRST = {
  F: [
    "Maya", "Priya", "Ines", "Lena", "Sana", "Nadia", "Freya", "Yuki", "Amara", "Leila", "Clara",
    "Mirela", "Tova", "Rosa", "Ada", "Zora", "Nell", "Esme", "Greta", "Hana", "Iris", "Petra",
  ],
  M: [
    "Theo", "Jonas", "Kofi", "Rafael", "Otto", "Emeka", "Diego", "Hugo", "Felix", "Mateo", "Anton",
    "Idris", "Bram", "Luca", "Omar", "Silas", "Tomas", "Ezra", "Viktor", "Kenji", "Nico", "Ruben",
  ],
};

const START_PEOPLE = 5;
const MAX_PEOPLE = 20; // FIRST has 22 per sex, so even an all-one-sex run keeps 2 spare names for lures
const PASS_PCT = 90;
const peopleFor = (level) => Math.min(START_PEOPLE + level, MAX_PEOPLE);
const maxLevel = MAX_PEOPLE - START_PEOPLE;

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildRun(level) {
  const n = peopleFor(level);
  const faces = shuffle(FACES).slice(0, n);
  const firstPool = { F: shuffle(FIRST.F), M: shuffle(FIRST.M) };
  const people = faces.map((face) => ({
    face: import.meta.env.BASE_URL + "faces/" + face.file,
    sex: face.sex,
    name: firstPool[face.sex].pop(),
  }));

  const questions = people.map((p, i) => {
    // Lures always match the face's sex (a name that doesn't fit is too easy to
    // rule out): other faces' names in this run first, then unused names.
    const studied = shuffle(people.filter((q, j) => j !== i && q.sex === p.sex).map((q) => q.name));
    const lures = [...studied, ...firstPool[p.sex]].slice(0, 3);
    return { face: p.face, answer: p.name, options: shuffle([p.name, ...lures]) };
  });
  return { level, people, questions: shuffle(questions) };
}

export default function WhosWho({ onBack, onFinish, best }) {
  const level = Math.min(best.level || 0, maxLevel);
  const run = useRef(buildRun(level));
  const timer = useRef(null);
  const answers = useRef([]);
  const [phase, setPhase] = useState("study"); // study | pause | test | done
  const [studyIdx, setStudyIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [mark, setMark] = useState(null); // chosen option
  const [summary, setSummary] = useState(null);

  function later(fn, ms) {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  }

  function nextPerson() {
    if (studyIdx + 1 < run.current.people.length) {
      setStudyIdx(studyIdx + 1);
      return;
    }
    setPhase("pause");
    later(() => setPhase("test"), 2500);
  }

  function answer(opt) {
    if (phase !== "test" || mark !== null) return;
    const q = run.current.questions[qIdx];
    answers.current.push(opt === q.answer);
    setMark(opt);
    later(() => {
      setMark(null);
      if (qIdx + 1 >= run.current.questions.length) finish();
      else setQIdx(qIdx + 1);
    }, opt === q.answer ? 450 : 1300);
  }

  function finish() {
    const r = run.current;
    const right = answers.current.filter(Boolean).length;
    const pct = Math.round((right / answers.current.length) * 100);
    const leveledUp = pct >= PASS_PCT && r.level < maxLevel;
    const xpEarned = 10 + right * 8;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        bestPct: Math.max(prev.bestPct, pct),
        bestNamePct: Math.max(prev.bestNamePct, pct),
        maxPeople: pct >= PASS_PCT ? Math.max(prev.maxPeople, r.people.length) : prev.maxPeople,
        level: leveledUp ? r.level + 1 : prev.level || 0,
        plays: prev.plays + 1,
      }),
    });
    setSummary({ pct, right, total: answers.current.length, leveledUp, xpEarned, people: r.people.length });
    setPhase("done");
  }

  function start() {
    clearTimeout(timer.current);
    run.current = buildRun(Math.min(best.level || 0, maxLevel));
    answers.current = [];
    setSummary(null);
    setMark(null);
    setQIdx(0);
    setStudyIdx(0);
    setPhase("study");
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (ev) => {
      if (phase === "study" && (ev.key === "Enter" || ev.key === " " || ev.key === "ArrowRight")) {
        ev.preventDefault();
        nextPerson();
      }
      if (phase !== "test") return;
      const n = Number(ev.key);
      const opts = run.current.questions[qIdx].options;
      if (n >= 1 && n <= opts.length) answer(opts[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const r = run.current;
  const person = phase === "study" ? r.people[studyIdx] : null;
  const q = phase === "test" ? r.questions[qIdx] : null;

  function optClass(opt) {
    if (mark === null) return "btn";
    if (opt === q.answer) return "btn ww-correct";
    if (opt === mark) return "btn ww-wrong";
    return "btn";
  }

  return (
    <>
      <GameHeader color="var(--temporalpole)" regionLabel="Temporal Pole · Who's Who" title="Who's Who" onBack={onBack}>
        <span className="stat-pill">
          <b className="mono">{r.people.length}</b> faces
        </span>
        <span className="stat-pill">
          Most held <b className="mono">{best.maxPeople || "—"}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={`${summary.pct}%`}
            detail={
              `named ${summary.right} of ${summary.total} faces · +${summary.xpEarned} xp to Temporal Pole` +
              (summary.leveledUp ? ` · level up: ${summary.people + 1} faces next time` : ` · ${PASS_PCT}% to add a face`)
            }
            onAgain={start}
            onBack={onBack}
          />
        ) : phase === "study" && person ? (
          <>
            <div className="wh-card" key={studyIdx}>
              <img className="wh-face" src={person.face} alt="" />
              <div className="wh-name">{person.name}</div>
            </div>
            <button className="btn btn--primary" onClick={nextPerson}>
              {studyIdx + 1 < r.people.length ? "Next person →" : "Start the test →"}
            </button>
            <p className="stage-msg">
              Person {studyIdx + 1} of {r.people.length} · take as long as you like. Link the <b style={{ color: "var(--temporalpole)" }}>name</b> to the face — the wrong answers
              are the other faces' names.
            </p>
          </>
        ) : phase === "pause" ? (
          <p className="stage-msg big">Now — who's who?</p>
        ) : q ? (
          <>
            <img className="wh-face wh-face--test" src={q.face} alt="" />
            <div className="wh-prompt">Who is this?</div>
            <div className="wh-options">
              {q.options.map((opt, i) => (
                <button key={opt} className={optClass(opt)} onClick={() => answer(opt)}>
                  <span className="mono wh-key">{i + 1}</span> {opt}
                </button>
              ))}
            </div>
            <p className="stage-msg">
              {qIdx + 1} / {r.questions.length}
            </p>
          </>
        ) : null}
      </div>
    </>
  );
}
