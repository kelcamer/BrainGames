import { useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import SessionSummary from "../components/SessionSummary.jsx";

// Entorhinal cortex — what + where + WHEN binding. A "day at home" plays out:
// objects turn up one at a time, each in a room. At test, for each object:
// which room was it in, and where on the day's timeline did it appear?
//
// Why this task: the entorhinal cortex is the gateway that packages an item
// with its context before the hippocampus stores it. Its lateral part carries
// time within an experience — rodent lateral entorhinal neurons drift with
// elapsed time (Tsao et al. 2018, doi:10.1038/s41586-018-0459-6), and in
// humans, lateral entorhinal activity predicts how precisely people can place
// a moment on the timeline of an episode (Montchal, Reagh & Yassa 2019,
// doi:10.1038/s41593-018-0303-1). Where Was It? trains what + where; this adds
// when. Left entorhinal surface area is 8th-24th percentile on the scan
// (10-35 depending on atlas, so the least certain of the lows).
//
// Rooms are home places on purpose: the everyday version of this failure is
// "where did I put it, and was that before or after I came in?"

const ROOMS = [
  { name: "Kitchen", emoji: "🍳", tint: "#3a2a1a" },
  { name: "Car", emoji: "🚗", tint: "#1c2a3a" },
  { name: "Bedroom", emoji: "🛏️", tint: "#2e1f33" },
  { name: "Yard", emoji: "🌳", tint: "#16301c" },
  { name: "Office", emoji: "💻", tint: "#2a2d30" },
  { name: "Hallway", emoji: "🚪", tint: "#33291c" },
];

const OBJECTS = [
  ["🔑", "keys"], ["👓", "glasses"], ["📱", "phone"], ["💊", "pill bottle"], ["🧦", "sock"],
  ["☂️", "umbrella"], ["🎧", "headphones"], ["🔦", "flashlight"], ["📎", "paperclip"], ["🧸", "teddy bear"],
  ["🎈", "balloon"], ["⏰", "alarm clock"], ["🕯️", "candle"], ["🧤", "gloves"], ["📷", "camera"],
  ["🎲", "die"], ["🧲", "magnet"], ["🧵", "thread"], ["🎁", "gift"], ["🪞", "mirror"],
  ["🦴", "dog bone"], ["🎸", "guitar"], ["🔔", "bell"], ["🧩", "puzzle piece"], ["⌛", "hourglass"],
];

// [objects in the day, rooms in play]. A run at PASS_PCT+ fully-bound climbs a rung.
const LADDER = [
  [5, 3], [6, 3], [7, 4], [8, 4], [10, 5], [12, 5], [14, 6],
];
const PASS_PCT = 75; // share of objects with the right room AND time within one slot
const STUDY_MS = 2200;
const GAP_MS = 350;

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
  const pool = shuffle(OBJECTS).slice(0, nItems);
  // spread objects evenly across rooms, and never put the same room twice in a
  // row (a run of "Kitchen, Kitchen" would let room order stand in for time)
  let roomOrder;
  for (let tries = 0; tries < 50; tries++) {
    roomOrder = shuffle(Array.from({ length: nItems }, (_, i) => i % nRooms));
    if (roomOrder.every((r, i) => i === 0 || r !== roomOrder[i - 1])) break;
  }
  const day = pool.map(([emoji, name], i) => ({ emoji, name, room: roomOrder[i], time: i }));
  return { level, rooms, day, test: shuffle(day) };
}

export default function WhereWhen({ onBack, onFinish, best }) {
  const level = Math.min(best.level || 0, LADDER.length - 1);
  const run = useRef(buildRun(level));
  const timers = useRef([]);
  const answers = useRef([]);
  const [phase, setPhase] = useState("study"); // study | pause | where | when | done
  const [studyIdx, setStudyIdx] = useState(-1);
  const [testIdx, setTestIdx] = useState(0);
  const [roomPick, setRoomPick] = useState(null);
  const [mark, setMark] = useState(null); // { room, time } feedback after the "when" answer
  const [summary, setSummary] = useState(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  function playStudy(i) {
    const r = run.current;
    if (i >= r.day.length) {
      setStudyIdx(-1);
      setPhase("pause");
      later(() => setPhase("where"), 2500);
      return;
    }
    setStudyIdx(i);
    later(() => {
      setStudyIdx(-1);
      later(() => playStudy(i + 1), GAP_MS);
    }, STUDY_MS);
  }

  function pickRoom(i) {
    if (phase !== "where") return;
    setRoomPick(i);
    setPhase("when");
  }

  function pickTime(t) {
    if (phase !== "when" || mark) return;
    const item = run.current.test[testIdx];
    const roomRight = roomPick === item.room;
    const err = Math.abs(t - item.time);
    answers.current.push({ item, roomRight, err, picked: t });
    setMark({ time: t });
    later(() => {
      setMark(null);
      setRoomPick(null);
      if (testIdx + 1 >= run.current.test.length) finish();
      else {
        setTestIdx(testIdx + 1);
        setPhase("where");
      }
    }, roomRight && err <= 1 ? 700 : 1500);
  }

  function finish() {
    const r = run.current;
    const a = answers.current;
    const n = a.length;
    const roomRight = a.filter((x) => x.roomRight).length;
    const timeExact = a.filter((x) => x.err === 0).length;
    const timeClose = a.filter((x) => x.err <= 1).length;
    const bound = a.filter((x) => x.roomRight && x.err <= 1).length;
    const meanErr = Math.round((a.reduce((s, x) => s + x.err, 0) / n) * 10) / 10;
    const pct = Math.round((bound / n) * 100);
    const leveledUp = pct >= PASS_PCT && r.level < LADDER.length - 1;
    const xpEarned = 10 + bound * 7 + roomRight * 2 + timeExact * 2;
    onFinish({
      xpEarned,
      updateBest: (prev) => ({
        bestPct: Math.max(prev.bestPct, pct),
        maxItems: pct >= PASS_PCT ? Math.max(prev.maxItems, n) : prev.maxItems,
        level: leveledUp ? r.level + 1 : prev.level || 0,
        plays: prev.plays + 1,
      }),
    });
    setSummary({ pct, bound, n, roomRight, timeExact, timeClose, meanErr, leveledUp, xpEarned, level: r.level });
    setPhase("done");
  }

  function start() {
    clearTimers();
    run.current = buildRun(Math.min(best.level || 0, LADDER.length - 1));
    answers.current = [];
    setSummary(null);
    setMark(null);
    setRoomPick(null);
    setTestIdx(0);
    setPhase("study");
    later(() => playStudy(0), 600);
  }

  useEffect(() => {
    later(() => playStudy(0), 600);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keys: 1..n picks a room, then 1..9 (and 0 for slot 10) picks a time slot
  useEffect(() => {
    const onKey = (ev) => {
      const k = Number(ev.key === "0" ? 10 : ev.key);
      if (!k) return;
      if (phase === "where" && k <= run.current.rooms.length) pickRoom(k - 1);
      else if (phase === "when" && k <= run.current.day.length) pickTime(k - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const r = run.current;
  const [nItems, nRooms] = LADDER[r.level];
  const studying = phase === "study" && studyIdx >= 0 ? r.day[studyIdx] : null;
  const testing = phase === "where" || phase === "when" ? r.test[testIdx] : null;

  function slotClass(t) {
    if (!mark) return "wn-slot";
    if (t === testing.time) return "wn-slot wn-slot--truth";
    if (t === mark.time) return "wn-slot wn-slot--wrong";
    return "wn-slot";
  }

  return (
    <>
      <GameHeader color="var(--entorhinal)" regionLabel="Entorhinal Cortex · Where & When" title="Where & When" onBack={onBack}>
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
            eyebrow="day replayed"
            bigNum={`${summary.pct}%`}
            detail={
              `fully bound (right room + time within one step) for ${summary.bound} of ${summary.n} · right room ${summary.roomRight} of ${summary.n} · ` +
              `exact time ${summary.timeExact}, within one step ${summary.timeClose} · average time error ${summary.meanErr} steps · +${summary.xpEarned} xp to Entorhinal Cortex` +
              (summary.leveledUp ? ` · level up: ${LADDER[summary.level + 1][0]} objects, ${LADDER[summary.level + 1][1]} rooms next time` : ` · ${PASS_PCT}% to level up`)
            }
            onAgain={start}
            onBack={onBack}
          >
            <p className="stage-msg">
              Knowing <em>where</em> but not <em>when</em> (or the reverse) is the binding gap this drill trains. Tip: link each object to the one before it with a quick story — that's the same trick as habit chains.
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
              Remember <b style={{ color: "var(--entorhinal)" }}>where</b> each object is — and <b style={{ color: "var(--entorhinal)" }}>when</b> in the day it turned up.
            </p>
          </>
        ) : phase === "pause" ? (
          <p className="stage-msg big">Replay the day…</p>
        ) : (
          <>
            <div className="ww-scene ww-scene--test">
              <div className="ww-object">{testing.emoji}</div>
              <div className="ww-object-name">{testing.name}</div>
              {phase === "when" && roomPick !== null && (
                <div className="ww-room-name">
                  in the {r.rooms[roomPick].name}
                  {mark && (roomPick === testing.room ? " ✓" : ` ✗ (${r.rooms[testing.room].name})`)}
                </div>
              )}
            </div>
            {phase === "where" ? (
              <>
                <p className="stage-msg">Where was it?</p>
                <div className="ww-options">
                  {r.rooms.map((room, i) => (
                    <button key={room.name} className="btn" onClick={() => pickRoom(i)}>
                      {room.emoji} {room.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="stage-msg">When in the day? (first → last)</p>
                <div className="wn-timeline" style={{ gridTemplateColumns: `repeat(${r.day.length}, 1fr)` }}>
                  {r.day.map((_, t) => (
                    <button key={t} className={slotClass(t)} onClick={() => pickTime(t)} aria-label={`step ${t + 1}`}>
                      {t + 1}
                    </button>
                  ))}
                </div>
                <div className="wn-ends">
                  <span>morning</span>
                  <span>evening</span>
                </div>
              </>
            )}
            <p className="stage-msg">
              {testIdx + 1} / {r.test.length} · number keys work
            </p>
          </>
        )}
      </div>
    </>
  );
}
