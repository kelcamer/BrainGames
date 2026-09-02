import BrainMap from "./BrainMap.jsx";
import GameGrid from "./GameGrid.jsx";
import Badges from "./Badges.jsx";

export default function Dashboard({ xp, badges, lastPlayed, onPlay }) {
  return (
    <main className="view view-enter">
      {/* Games first — least friction to just start playing */}
      <div className="section-head" style={{ marginTop: 4 }}>
        <h2 className="display" style={{ fontSize: 24 }}>
          Drills
        </h2>
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>pick one — sessions run ~2 minutes · most recent first</span>
      </div>
      <GameGrid xp={xp} onPlay={onPlay} lastPlayed={lastPlayed} />

      <div className="section-head">
        <h2 className="display" style={{ fontSize: 24 }}>
          Badges
        </h2>
      </div>
      <Badges unlocked={badges} />

      {/* Context about the scan these drills are based on — moved to the bottom */}
      <div className="section-head">
        <span className="eyebrow">Trained on your own FreeSurfer scan</span>
      </div>
      <h1 className="display" style={{ fontSize: 40, marginTop: 6 }}>
        Train your weakest regions.
      </h1>
      <p className="lede" style={{ marginTop: 10 }}>
        Four cortical clusters came back in the bottom few percentiles on your scan, plus one subcortical structure — your hippocampus — that's the weakest thing on the scan outside those four
        extremes. Each one maps to a real perceptual, motor, or memory function you can actually drill — so that's what these drills do.
      </p>

      <BrainMap />
    </main>
  );
}
