import BrainMap from "./BrainMap.jsx";
import GameGrid from "./GameGrid.jsx";
import Badges from "./Badges.jsx";

export default function Dashboard({ xp, badges, onPlay }) {
  return (
    <main className="view view-enter">
      <span className="eyebrow">Trained on your own FreeSurfer scan</span>
      <h1 className="display" style={{ fontSize: 44, marginTop: 6 }}>
        Train your weakest regions.
      </h1>
      <p className="lede" style={{ marginTop: 10 }}>
        Four cortical clusters came back in the bottom few percentiles on your scan, plus one subcortical structure — your hippocampus — that's the weakest thing on the scan outside those four
        extremes. Each one maps to a real perceptual, motor, or memory function you can actually drill — so that's what these drills do.
      </p>

      <BrainMap />

      <div className="section-head">
        <h2 className="display" style={{ fontSize: 24 }}>
          Drills
        </h2>
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>pick one — sessions run ~2 minutes</span>
      </div>
      <GameGrid xp={xp} onPlay={onPlay} />

      <div className="section-head">
        <h2 className="display" style={{ fontSize: 24 }}>
          Badges
        </h2>
      </div>
      <Badges unlocked={badges} />
    </main>
  );
}
