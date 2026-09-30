import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

// Parahippocampal cortex — object-in-context (source) memory. Objects appear one
// at a time, each inside a room. At test, for each object: which room was it in,
// or was it never shown? New objects mixed in keep "I've seen it" separate from
// "I know where I saw it" — only the second one is the target.
//
// Why this task: in the medial-temporal model that best fits the imaging data,
// perirhinal cortex carries "have I seen this item" and parahippocampal cortex
// carries the context it was in (Diana, Yonelinas & Ranganath 2007,
// doi:10.1016/j.tics.2007.08.001; review of parahippocampal context processing in
// Aminoff, Kveraga & Bar 2013, doi:10.1016/j.tics.2013.06.009). Left
// parahippocampal surface area is 9th-24th percentile on the scan (its volume
// is large, 95th).
//
// Objects are picked to have nothing to do with any room — a pan in the kitchen
// can be guessed, a sock on the beach has to be remembered.

const ROOMS = [
  { name: "Kitchen", emoji: "🍳", tint: "#3a2a1a" },
  { name: "Beach", emoji: "🏖️", tint: "#1a3440" },
  { name: "Forest", emoji: "🌲", tint: "#16301c" },
  { name: "Library", emoji: "📚", tint: "#2e1f33" },
  { name: "Garage", emoji: "🔧", tint: "#2a2d30" },
  { name: "Rooftop", emoji: "🏙️", tint: "#1c2238" },
];

const OBJECTS = [
  ["🎈", "balloon"], ["⏰", "alarm clock"], ["🧦", "sock"], ["🔑", "key"], ["🎸", "guitar"],
  ["🕯️", "candle"], ["🧸", "teddy bear"], ["📷", "camera"], ["☂️", "umbrella"], ["🎲", "die"],
  ["🪁", "kite"], ["🧲", "magnet"], ["🎩", "top hat"], ["🧤", "gloves"], ["🥁", "drum"],
  ["🔔", "bell"], ["📎", "paperclip"], ["🪀", "yo-yo"], ["🧵", "thread"], ["🎁", "gift"],
  ["🪞", "mirror"], ["👓", "glasses"], ["🎧", "headphones"], ["🕹️", "joystick"], ["🧩", "puzzle piece"],
  ["🔦", "flashlight"], ["🎺", "trumpet"], ["🧮", "abacus"], ["🪃", "boomerang"], ["🎀", "ribbon"],
  ["🧭", "compass"], ["⌛", "hourglass"], ["🪅", "piñata"], ["🎻", "violin"], ["🧿", "charm"],
];

// [objects studied, rooms in play]. Pass (80%+ rooms right) climbs one rung.
const LADDER = [
  [6, 3], [8, 3], [8, 4], [10, 4], [12, 5], [14, 5], [16, 6],
];
const PASS_PCT = 80;
const STUDY_MS = 2200;
const GAP_MS = 350;
const NEW_FRACTION = 0.25; // share of test items that were never shown

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildRun(level) {
  const [nItems, nRooms] = LADDER[level];
  const rooms = shuffle(ROOMS).slice(0, nRooms);
  const nNew = Math.max(2, Math.round(nItems * NEW_FRACTION));
  const pool = shuffle(OBJECTS).slice(0, nItems + nNew);
  // spread objects evenly across rooms so no room is a safe default guess
  const roomOrder = shuffle(Array.from({ length: nItems }, (_, i) => i % nRooms));
  const studied = pool.slice(0, nItems).map(([emoji, name], i) => ({ emoji, name, room: roomOrder[i] }));
  const lures = pool.slice(nItems).map(([emoji, name]) => ({ emoji, name, room: null }));
  return { level, rooms, studied, test: shuffle([...studied, ...lures]) };
}

export default function WhereWasIt({ onBack, onFinish, best }) {
  const level = Math.min(best.level || 0, LADDER.length - 1);
  const run = useRef(buildRun(level));
  const timers = useRef([]);
  const answers = useRef([]);
  const [phase, setPhase] = useState("study"); // study | pause | test | done
  const [studyIdx, setStudyIdx] = useState(-1); // -1 = gap between objects
  const [testIdx, setTestIdx] = useState(0);
  const [mark, setMark] = useState(null); // { chosen, correct } for the answered item
  const [summary, setSummary] = useState(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  function playStudy(i) {
    const r = run.current;
    if (i >= r.studied.length) {
      setStudyIdx(-1);
      setPhase("pause");
      later(() => setPhase("test"), 2500);
      return;
    }
    setStudyIdx(i);
    later(() => {
      setStudyIdx(-1);
      later(() => playStudy(i + 1), GAP_MS);
    }, STUDY_MS);
  }

  function answer(choice) {
    // choice: room index, or null for "never shown"
    if (phase !== "test" || mark) return;
    const item = run.current.test[testIdx];
    const correct = choice === item.room;
    answers.current.push({ item, choice, correct });
    setMark({ chosen: choice, correct });
    later(() => {
      setMark(null);
      if (testIdx + 1 >= run.current.test.length) finish();
      else setTestIdx(testIdx + 1);
    }, correct ? 450 : 1100);
  }

  function finish() {
    const r = run.current;
    const a = answers.current;
    const old = a.filter((x) => x.item.room !== null);
    const roomRight = old.filter((x) => x.correct).length;
    // "seen it" regardless of room — shows how much of the miss was context vs the object itself
    const recognised = old.filter((x) => x.choice !== null).length;
    const newRight = a.filter((x) => x.item.room === null && x.correct).length;
    const newTotal = a.length - old.length;
    const pct = Math.round((roomRight / old.length) * 100);
    const leveledUp = pct >= PASS_PCT && r.level < LADDER.length - 1;
    const xpEarned = 10 + roomRight * 6 + newRight * 2;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        bestPct: Math.max(prev.bestPct, pct),
        maxItems: pct >= PASS_PCT ? Math.max(prev.maxItems, old.length) : prev.maxItems,
        level: leveledUp ? r.level + 1 : prev.level || 0,
        plays: prev.plays + 1,
      }),
    });
    setSummary({ pct, roomRight, total: old.length, recognised, newRight, newTotal, leveledUp, xpEarned, level: r.level });
    setPhase("done");
  }

  function start() {
    clearTimers();
    run.current = buildRun(Math.min(best.level || 0, LADDER.length - 1));
    answers.current = [];
    setSummary(null);
    setMark(null);
    setTestIdx(0);
    setPhase("study");
    later(() => playStudy(0), 600);
  }

  useEffect(() => {
    later(() => playStudy(0), 600);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // number keys: 1..n for rooms, 0 for "never shown"
  useEffect(() => {
    const onKey = (ev) => {
      if (phase !== "test") return;
      if (ev.key === "0") answer(null);
      const n = Number(ev.key);
      if (n >= 1 && n <= run.current.rooms.length) answer(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const r = run.current;
  const [nItems, nRooms] = LADDER[r.level];
  const studying = phase === "study" && studyIdx >= 0 ? r.studied[studyIdx] : null;
  const testing = phase === "test" ? r.test[testIdx] : null;

  function optClass(choice) {
    if (!mark) return "btn";
    if (choice === testing.room) return "btn ww-correct";
    if (choice === mark.chosen) return "btn ww-wrong";
    return "btn";
  }

  return (
    <>
      <GameHeader color="var(--scene)" regionLabel="Parahippocampal Cortex · Where Was It?" title="Where Was It?" onBack={onBack}>
        <span className="stat-pill">
          <b className="mono">{nItems}</b> objects · <b className="mono">{nRooms}</b> rooms
        </span>
        <span className="stat-pill">
          Best <b className="mono">{best.bestPct}%</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        {summary ? (
          <SessionSummary
            eyebrow="run complete"
            bigNum={`${summary.pct}%`}
            detail={
              `right room for ${summary.roomRight} of ${summary.total} objects · recognised ${summary.recognised} of ${summary.total} as seen · ` +
              `${summary.newRight} of ${summary.newTotal} new objects correctly called new · +${summary.xpEarned} xp to Parahippocampal Cortex` +
              (summary.leveledUp ? ` · level up: ${LADDER[summary.level + 1][0]} objects, ${LADDER[summary.level + 1][1]} rooms next time` : ` · ${PASS_PCT}% to level up`)
            }
            onAgain={start}
            onBack={onBack}
          >
            <p className="stage-msg">
              The gap between "recognised" and "right room" is the part this drill trains: you knew you'd seen it, but not where.
            </p>
          </SessionSummary>
        ) : phase === "study" ? (
          <>
            <div className="ww-scene" style={studying ? { background: r.rooms[studying.room].tint } : undefined}>
              {studying && (
                <>
                  <div className="ww-room-name">
                    {r.rooms[studying.room].emoji} {r.rooms[studying.room].name}
                  </div>
                  <div className="ww-object">{studying.emoji}</div>
                  <div className="ww-object-name">{studying.name}</div>
                </>
              )}
            </div>
            <p className="stage-msg">
              Remember <b style={{ color: "var(--scene)" }}>which room</b> each object is in.
            </p>
          </>
        ) : phase === "pause" ? (
          <p className="stage-msg big">Hold on to them…</p>
        ) : (
          <>
            <div className="ww-scene ww-scene--test">
              <div className="ww-object">{testing.emoji}</div>
              <div className="ww-object-name">{testing.name}</div>
            </div>
            <div className="ww-options">
              {r.rooms.map((room, i) => (
                <button key={room.name} className={optClass(i)} onClick={() => answer(i)}>
                  {room.emoji} {room.name}
                </button>
              ))}
              <button className={optClass(null) + " ww-new"} onClick={() => answer(null)}>
                ✨ Never shown
              </button>
            </div>
            <p className="stage-msg">
              {testIdx + 1} / {r.test.length} · keys 1–{r.rooms.length}, 0 = never shown
            </p>
          </>
        )}
      </div>
    </>
  );
}
