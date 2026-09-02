import { useState } from "react";
import { useGameState } from "./hooks/useGameState.js";
import { GAME_REGION } from "./data/regions.js";
import Hud from "./components/Hud.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ScanModal from "./components/ScanModal.jsx";
import ResetModal from "./components/ResetModal.jsx";
import FlashFocus from "./games/FlashFocus.jsx";
import ToneTrace from "./games/ToneTrace.jsx";
import MotorChain from "./games/MotorChain.jsx";
import WordBlitz from "./games/WordBlitz.jsx";
import TraceMap from "./games/TraceMap.jsx";
import TraceMapHard from "./games/TraceMapHard.jsx";
import RhythmRecall from "./games/RhythmRecall.jsx";

const GAME_COMPONENTS = {
  flashfocus: FlashFocus,
  tonetrace: ToneTrace,
  motorchain: MotorChain,
  wordblitz: WordBlitz,
  tracemap: TraceMap,
  tracemaphard: TraceMapHard,
  rhythmrecall: RhythmRecall,
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

      {view === "dashboard" && <Dashboard xp={state.xp} badges={state.badges} onPlay={setView} />}

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
          This is a personal engagement tool, not a diagnostic or medical device. It gamifies functions <em>associated</em> with each region (visual discrimination, pitch discrimination, motor
          sequencing, rapid word recognition, spatial/episodic memory) — practicing a function may sharpen it, but that isn't the same as verified structural change to brain tissue. Percentiles
          are from a FreeSurfer + Potvin (2016) + CentileBrain (2024) normative comparison, self-audited in three passes. Progress is stored only in this browser's local storage.
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
