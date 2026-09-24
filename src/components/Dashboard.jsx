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
        <span className="eyebrow">Trained on your own MRI · audited 24 Sep 2026</span>
      </div>
      <h1 className="display" style={{ fontSize: 40, marginTop: 6 }}>
        Train your weakest regions.
      </h1>
      <p className="lede" style={{ marginTop: 10 }}>
        Four regions came back at the 20th percentile or lower in surface area: left temporal pole (1st), left parahippocampal (5.8th), left orbitofrontal (12th–19th) and left
        motor cortex (14th–19th). Smaller than peers is a measurement, not a verdict on ability — but each one maps to a job you can drill, so the first three cards target them.
        Left touch cortex (18th) is also low, but a screen can't train touch. Everything else here plays to strengths: thalamus 92nd–97th, visual cortex, left parietal.
      </p>

      <BrainMap />
    </main>
  );
}
