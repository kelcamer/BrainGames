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
        <span className="eyebrow">Trained on your own MRI · record of 29 Sep 2026</span>
      </div>
      <h1 className="display" style={{ fontSize: 40, marginTop: 6 }}>
        Train your weakest regions.
      </h1>
      <p className="lede" style={{ marginTop: 10 }}>
        Your cortex is typical overall — fewer extreme regions than the typical woman. The mild lows that repeat across comparison groups are left entorhinal (8th–24th), left
        parahippocampal (9th–24th, surface area only), left lateral orbitofrontal (19th–33rd), right pars orbitalis (17th–25th) and the right temporal front tip (18th–29th). Smaller
        than peers is a measurement, not a verdict on ability — but each maps to a job you can drill, so the first four cards target them. What stands out is deep: thalamus
        97th–99th in every group, hypothalamus 90th–99th. Visual cortex and left parietal are large too.
      </p>

      <BrainMap />
    </main>
  );
}
