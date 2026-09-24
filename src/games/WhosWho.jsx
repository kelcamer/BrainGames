import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

// Left temporal pole — learning and retrieving the names of specific people.
// Meet a few made-up people (name, job, hometown), then two kinds of question:
//   • about → name: "the pilot from Oslo is…" — the proper-name retrieval step
//   • name → fact:  "Maya Brenner is the…"
// Name lures are recombinations of the other people's first and last names, so
// "I've seen Maya and I've seen Brenner" isn't enough: you have to know they go
// together on the same person.
//
// Why this task: people with left temporal pole damage can recognise and
// describe familiar people but can't retrieve their names (Damasio et al. 1996,
// doi:10.1038/380499a0; Tranel 2009, doi:10.1080/02687030802586498). Left
// temporal pole is the 1st percentile on the scan (range 0-6th after the
// conversion uncertainty — low either way). Text only, no faces.

const FIRST = [
  "Maya", "Theo", "Priya", "Jonas", "Ines", "Kofi", "Lena", "Rafael", "Sana", "Otto",
  "Nadia", "Emeka", "Freya", "Diego", "Yuki", "Hugo", "Amara", "Felix", "Leila", "Mateo",
];
const LAST = [
  "Brenner", "Okafor", "Lindqvist", "Moreau", "Tanaka", "Castillo", "Novak", "Haddad", "Whitlock", "Ferreira",
  "Kowalski", "Mbeki", "Sorensen", "Delacroix", "Varga", "Ashford", "Reyes", "Holloway", "Ivanova", "Quinn",
];
const JOBS = [
  "baker", "pilot", "dentist", "beekeeper", "locksmith", "violinist", "geologist", "florist", "lighthouse keeper", "tailor",
  "zookeeper", "architect", "chef", "librarian", "surveyor", "glassblower", "ferry captain", "cartographer", "pastry judge", "rope maker",
];
const TOWNS = [
  "Lisbon", "Oslo", "Denver", "Nairobi", "Osaka", "Tulsa", "Glasgow", "Perth", "Quito", "Tampere",
  "Halifax", "Boise", "Cork", "Porto", "Hilo", "Reno", "Graz", "Bergen", "Cusco", "Split",
];

const LADDER = [3, 4, 5, 6, 8, 10]; // people per run
const PASS_PCT = 80;
const STUDY_MS = 5000;

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
const fullName = (p) => `${p.first} ${p.last}`;

function buildRun(level) {
  const n = LADDER[level];
  const firsts = shuffle(FIRST).slice(0, n);
  const lasts = shuffle(LAST).slice(0, n);
  const jobs = shuffle(JOBS).slice(0, n);
  const towns = shuffle(TOWNS).slice(0, n);
  const people = firsts.map((first, i) => ({ first, last: lasts[i], job: jobs[i], town: towns[i] }));

  const questions = [];
  people.forEach((p, i) => {
    // about → name. Lures: recombined names first, then other real people.
    const recombined = shuffle(
      people.flatMap((q, j) => (j === i ? [] : [`${p.first} ${q.last}`, `${q.first} ${p.last}`]))
    );
    const others = shuffle(people.filter((_, j) => j !== i).map(fullName));
    const lures = [...new Set([...recombined.slice(0, 2), ...others])].slice(0, 3);
    questions.push({
      kind: "name",
      prompt: `The ${p.job} from ${p.town} is…`,
      answer: fullName(p),
      options: shuffle([fullName(p), ...lures]),
    });
    // name → fact (job or hometown, at random)
    const askJob = Math.random() < 0.5;
    const field = askJob ? "job" : "town";
    const otherVals = shuffle(people.filter((_, j) => j !== i).map((q) => q[field])).slice(0, 3);
    questions.push({
      kind: "fact",
      prompt: askJob ? `${fullName(p)} is the…` : `${fullName(p)} is from…`,
      answer: p[field],
      options: shuffle([p[field], ...otherVals]),
    });
  });
  return { level, people, questions: shuffle(questions) };
}

export default function WhosWho({ onBack, onFinish, best }) {
  const level = Math.min(best.level || 0, LADDER.length - 1);
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

  function showPerson(i) {
    if (i >= run.current.people.length) {
      setPhase("pause");
      later(() => setPhase("test"), 3000);
      return;
    }
    setStudyIdx(i);
    later(() => showPerson(i + 1), STUDY_MS);
  }

  function answer(opt) {
    if (phase !== "test" || mark !== null) return;
    const q = run.current.questions[qIdx];
    answers.current.push({ kind: q.kind, correct: opt === q.answer });
    setMark(opt);
    later(() => {
      setMark(null);
      if (qIdx + 1 >= run.current.questions.length) finish();
      else setQIdx(qIdx + 1);
    }, opt === q.answer ? 450 : 1300);
  }

  function finish() {
    const r = run.current;
    const a = answers.current;
    const right = a.filter((x) => x.correct).length;
    const names = a.filter((x) => x.kind === "name");
    const namesRight = names.filter((x) => x.correct).length;
    const pct = Math.round((right / a.length) * 100);
    const namePct = Math.round((namesRight / names.length) * 100);
    const leveledUp = pct >= PASS_PCT && r.level < LADDER.length - 1;
    const xpEarned = 10 + right * 4 + namesRight * 4; // name recall is the target, so it counts double
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        bestPct: Math.max(prev.bestPct, pct),
        bestNamePct: Math.max(prev.bestNamePct, namePct),
        maxPeople: pct >= PASS_PCT ? Math.max(prev.maxPeople, r.people.length) : prev.maxPeople,
        level: leveledUp ? r.level + 1 : prev.level || 0,
        plays: prev.plays + 1,
      }),
    });
    setSummary({ pct, namePct, namesRight, nameTotal: names.length, people: r.people.length, leveledUp, xpEarned, level: r.level });
    setPhase("done");
  }

  function start() {
    clearTimeout(timer.current);
    run.current = buildRun(Math.min(best.level || 0, LADDER.length - 1));
    answers.current = [];
    setSummary(null);
    setMark(null);
    setQIdx(0);
    setPhase("study");
    showPerson(0);
  }

  useEffect(() => {
    showPerson(0);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (ev) => {
      if (phase === "study" && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        showPerson(studyIdx + 1);
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
          <b className="mono">{LADDER[r.level]}</b> people
        </span>
        <span className="stat-pill">
          Best names <b className="mono">{best.bestNamePct}%</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={`${summary.namePct}% names`}
            detail={
              `named ${summary.namesRight} of ${summary.nameTotal} people from their job and town · ${summary.pct}% of all questions · +${summary.xpEarned} xp to Temporal Pole` +
              (summary.leveledUp ? ` · level up: ${LADDER[summary.level + 1]} people next time` : ` · ${PASS_PCT}% overall to level up`)
            }
            onAgain={start}
            onBack={onBack}
          />
        ) : phase === "study" && person ? (
          <>
            <div className="wh-card" key={studyIdx}>
              <div className="wh-name">{fullName(person)}</div>
              <div className="wh-facts">
                {person.job} · from {person.town}
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => showPerson(studyIdx + 1)}>
              Next person →
            </button>
            <p className="stage-msg">
              Person {studyIdx + 1} of {r.people.length}. Link the <b style={{ color: "var(--temporalpole)" }}>whole name</b> to the job and the town — the wrong answers mix up first and
              last names.
            </p>
          </>
        ) : phase === "pause" ? (
          <p className="stage-msg big">Now — who's who?</p>
        ) : q ? (
          <>
            <div className="wh-prompt">{q.prompt}</div>
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
