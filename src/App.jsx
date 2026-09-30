import { useState } from "react";
import { useGameState } from "./hooks/useGameState.js";
import { GAME_REGION } from "./data/regions.js";
import Hud from "./components/Hud.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ScanModal from "./components/ScanModal.jsx";
import ResetModal from "./components/ResetModal.jsx";
import FlashFocus from "./games/FlashFocus.jsx";
import Drift from "./games/Drift.jsx";
import ToneTrace from "./games/ToneTrace.jsx";
import MotorChain from "./games/MotorChain.jsx";
import WordBlitz from "./games/WordBlitz.jsx";
import TraceMap from "./games/TraceMap.jsx";
import TraceMapHard from "./games/TraceMapHard.jsx";
import RhythmRecall from "./games/RhythmRecall.jsx";
import Constellation from "./games/Constellation.jsx";
import MagicNumber from "./games/MagicNumber.jsx";
import BlockBuilder from "./games/BlockBuilder.jsx";
import GoNoGo from "./games/GoNoGo.jsx";
import NBack from "./games/NBack.jsx";
import TaskSwitch from "./games/TaskSwitch.jsx";
import WordRush from "./games/WordRush.jsx";
import EbbFlow from "./games/EbbFlow.jsx";
import Wayfinder from "./games/Wayfinder.jsx";
import OpenLoops from "./games/OpenLoops.jsx";
import Switchback from "./games/Switchback.jsx";
import WhereWasIt from "./games/WhereWasIt.jsx";
import WhosWho from "./games/WhosWho.jsx";
import WhereWhen from "./games/WhereWhen.jsx";

const GAME_COMPONENTS = {
  flashfocus: FlashFocus,
  drift: Drift,
  tonetrace: ToneTrace,
  motorchain: MotorChain,
  wordblitz: WordBlitz,
  tracemap: TraceMap,
  tracemaphard: TraceMapHard,
  rhythmrecall: RhythmRecall,
  constellation: Constellation,
  magicnumber: MagicNumber,
  blockbuilder: BlockBuilder,
  gonogo: GoNoGo,
  nback: NBack,
  taskswitch: TaskSwitch,
  wordrush: WordRush,
  ebbflow: EbbFlow,
  wayfinder: Wayfinder,
  openloops: OpenLoops,
  switchback: Switchback,
  wherewasit: WhereWasIt,
  whoswho: WhosWho,
  wherewhen: WhereWhen,
};

export default function App() {
  const { state, recordProgress, resetAll } = useGameState();
  const [view, setView] = useState("dashboard");
  const [scanOpen, setScanOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const goDashboard = () => setView("dashboard");

  const GameComponent = view === "dashboard" ? null : GAME_COMPONENTS[view];

  return (
    <div className="app-shell">
      <Hud state={state} onOpenScan={() => setScanOpen(true)} />

      {view === "dashboard" && <Dashboard xp={state.xp} badges={state.badges} lastPlayed={state.lastPlayed} onPlay={setView} />}

      {GameComponent && (
        <main className="view view-enter" key={view}>
          <GameComponent
            onBack={goDashboard}
            best={state.best[view]}
            onFinish={(payload) =>
              recordProgress(view, GAME_REGION[view], payload.xpEarned, payload.updateBest, payload.registerSession !== false)
            }
          />
        </main>
      )}

      <footer>
        <p className="disclaimer">
          This is a personal engagement tool, not a diagnostic or medical device. It gamifies functions <em>associated</em> with each region — practicing a function may sharpen it, but
          that isn't the same as verified structural change to brain tissue. Percentiles are from the 29 Sep 2026 record: plain size at age 27 against 483 healthy women and two
          groups of women run through the same software as the scan. Progress is stored only in this browser's local storage.
        </p>
        <div className="reset-row">
          <button className="btn btn--ghost btn--sm" onClick={() => setResetOpen(true)}>
            Reset progress
          </button>
        </div>
      </footer>

      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
      <ResetModal
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetAll();
          setResetOpen(false);
          setView("dashboard");
        }}
      />
    </div>
  );
}
