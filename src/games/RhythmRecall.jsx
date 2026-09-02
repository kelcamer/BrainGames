import { useCallback, useEffect, useRef, useState } from "react";
import GameHeader from "../components/GameHeader.jsx";
import { DRUMS, KEYMAP, hit, resume, now } from "../audio/drums.js";

const ORDER = DRUMS.map((d) => d.id);
const MAX_BPM = 150;
const BASE_BPM = 90;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Hippocampus × striatum — a Simon-says drum kit. I play a beat, you play it
// back, and every round adds one more hit and nudges the tempo up — the
// working-memory-to-motor-pattern handoff, live. Ported from the original
// Rhythm Recall prototype; all sounds are synthesized with Web Audio, no
// samples to load.
export default function RhythmRecall({ onBack, onFinish, best }) {
  const [round, setRound] = useState(0);
  const [bpm, setBpm] = useState(BASE_BPM);
  const [msg, setMsg] = useState({ text: "Press <b>Start</b> — headphones or speakers up 🔊", cls: "" });
  const [dots, setDots] = useState([]);
  const [lit, setLit] = useState(null);
  const [startLabel, setStartLabel] = useState("Start");
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [countin, setCountin] = useState(null);

  const g = useRef({ seq: [], input: 0, playing: false, accepting: false, round: 0, bpm: BASE_BPM, free: false });
  const litTimer = useRef(null);

  const flash = useCallback((drum) => {
    setLit(drum);
    clearTimeout(litTimer.current);
    litTimer.current = setTimeout(() => setLit(null), 150);
  }, []);

  const stepDur = () => 60 / g.current.bpm / 2; // eighth-note steps

  const setDot = (i, cls) =>
    setDots((prev) => {
      const next = prev.slice();
      next[i] = cls;
      return next;
    });

  const playSeq = useCallback(async () => {
    const st = g.current;
    st.playing = true;
    st.accepting = false;
    setLocked(true);
    setReplayEnabled(false);
    setMsg({ text: "👀 Watch &amp; listen…", cls: "watch" });
    setDots(st.seq.map(() => ""));

    const t0 = now() + 0.25;
    const dur = stepDur();
    st.seq.forEach((drum, i) => {
      const t = t0 + i * dur;
      hit(drum, t);
      const ms = (t - now()) * 1000;
      setTimeout(() => {
        flash(drum);
        setDot(i, "cur");
        if (i > 0) setDot(i - 1, "done");
      }, Math.max(0, ms));
    });

    const total = (t0 + st.seq.length * dur - now()) * 1000;
    await wait(total + 140);

    st.input = 0;
    setDots(st.seq.map(() => ""));
    st.playing = false;
    st.accepting = true;
    setLocked(false);
    setReplayEnabled(true);
    setMsg({ text: "🥁 Your turn — play it back!", cls: "go" });
  }, [flash]);

  const nextRound = useCallback(() => {
    const st = g.current;
    st.round += 1;
    st.seq.push(ORDER[Math.floor(Math.random() * ORDER.length)]);
    st.bpm = Math.min(MAX_BPM, BASE_BPM + (st.round - 1) * 4);
    setRound(st.round);
    setBpm(st.bpm);
    playSeq();
  }, [playSeq]);

  const countIn = useCallback((done) => {
    let n = 3;
    setCountin(n);
    hit("hat");
    const iv = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(iv);
        setCountin(null);
        done();
        return;
      }
      setCountin(n);
      hit("hat");
    }, (60 / g.current.bpm) * 1000);
  }, []);

  const startGame = useCallback(() => {
    resume();
    const st = g.current;
    st.free = false;
    st.seq = [];
    st.round = 0;
    st.input = 0;
    st.bpm = BASE_BPM;
    setStartLabel("Restart");
    setMsg({ text: "Here we go…", cls: "" });
    countIn(() => nextRound());
  }, [countIn, nextRound]);

  const gameOver = useCallback(
    (failedAtRound) => {
      const roundsCleared = Math.max(0, failedAtRound - 1);
      const xpEarned = 20 + roundsCleared * 12;
      onFinish({
        xpEarned,
        updateBest: (prev) => ({ maxRound: Math.max(prev.maxRound, roundsCleared), plays: prev.plays + 1 }),
      });
    },
    [onFinish]
  );

  const playerHit = useCallback(
    (drum) => {
      flash(drum);
      const st = g.current;

      if (st.free) {
        hit(drum);
        return;
      }
      if (!st.accepting) {
        hit(drum);
        return;
      }
      hit(drum);

      const expect = st.seq[st.input];
      if (drum === expect) {
        setDot(st.input, "done");
        st.input += 1;
        if (st.input === st.seq.length) {
          st.accepting = false;
          setMsg({ text: `✅ Nailed it — round ${st.round} clear!`, cls: "win" });
          setTimeout(nextRound, 850);
        }
      } else {
        st.accepting = false;
        setDot(st.input, "miss");
        hit("crash");
        setMsg({
          text: `✂️ Missed at hit ${st.input + 1} — expected <b>${expect.toUpperCase()}</b>. Reached round ${st.round}.`,
          cls: "fail",
        });
        setLocked(false);
        setStartLabel("Play Again");
        setReplayEnabled(false);
        gameOver(st.round);
      }
    },
    [flash, nextRound, gameOver]
  );

  const replay = useCallback(() => {
    if (!g.current.playing && g.current.seq.length) playSeq();
  }, [playSeq]);

  const freePlay = useCallback(() => {
    resume();
    const st = g.current;
    st.free = true;
    st.accepting = false;
    st.playing = false;
    st.seq = [];
    setLocked(false);
    setDots([]);
    setRound(0);
    setStartLabel("Start");
    setMsg({ text: "🎶 Free Play — whole kit's yours. Jam out.", cls: "go" });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (KEYMAP[k]) {
        resume();
        playerHit(KEYMAP[k]);
      }
      if (k === " ") {
        e.preventDefault();
        if (!g.current.playing) replay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playerHit, replay]);

  const roundDisp = g.current.free ? "—" : round || "—";
  const lenDisp = g.current.free ? "—" : g.current.seq.length || "—";

  return (
    <>
      <GameHeader color="var(--hippocampus)" regionLabel="Hippocampus × Percussion · Rhythm Recall" title="Rhythm Recall" onBack={onBack}>
        <span className="stat-pill">
          Best round <b className="mono">{best.maxRound}</b>
        </span>
        <span className="stat-pill">
          Tempo <b className="mono">{bpm}</b>
        </span>
      </GameHeader>
      <div className="game-stage">
        <p className="stage-msg" style={{ maxWidth: "56ch" }}>
          I play a beat. You play it back. Every round adds one more hit — watch your working memory turn into muscle memory.
        </p>

        <div className="rr-board">
          <Stat k="Round" v={roundDisp} />
          <Stat k="Length" v={lenDisp} />
          <Stat k="Best" v={best.maxRound} />
          <Stat k="Tempo" v={bpm} />
        </div>

        <p className="stage-msg big" dangerouslySetInnerHTML={{ __html: msg.text }} />

        <div className="rr-kit">
          {DRUMS.map((d) => (
            <div
              key={d.id}
              className={`rr-pad ${lit === d.id ? "lit" : ""}`}
              tabIndex={0}
              onPointerDown={(e) => {
                e.preventDefault();
                resume();
                playerHit(d.id);
              }}
              style={{ opacity: locked ? 0.6 : 1, pointerEvents: locked ? "none" : "auto" }}
            >
              <span className="key">{d.key}</span>
              <span className="disc" />
              <span className="lbl">{d.label}</span>
            </div>
          ))}
        </div>

        <div className="rr-seqrow">
          {dots.map((state, i) => (
            <div key={i} className={`rr-dot ${state}`} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn btn--primary" onClick={startGame}>
            {startLabel}
          </button>
          <button className="btn btn--ghost" onClick={replay} disabled={!replayEnabled}>
            ↻ Replay Beat
          </button>
          <button className="btn btn--ghost" onClick={freePlay}>
            Free Play
          </button>
        </div>

        <p className="stage-msg">
          Keys <b>A S D F G</b> or tap the pads. <b>Free Play</b> unlocks the whole kit with no memory test — just jam.
        </p>

        {countin != null && <div className="rr-countin">{countin}</div>}
      </div>
    </>
  );
}

function Stat({ k, v }) {
  return (
    <div className="rr-stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
