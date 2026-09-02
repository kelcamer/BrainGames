import { levelFromXp } from "../data/regions.js";

export default function Hud({ state, onOpenScan }) {
  const totalXp = Object.values(state.xp).reduce((s, v) => s + v, 0);
  return (
    <div className="hud">
      <div className="hud__brand">
        <span className="display">Cortex Console</span>
        <span className="tag">personal MRI-informed training</span>
      </div>
      <div className="hud__stats">
        <span className="stat-pill">
          <span className="dot" />Streak <b className="mono">{state.streak}</b>
        </span>
        <span className="stat-pill">
          Level <b className="mono">{levelFromXp(totalXp)}</b>
        </span>
        <span className="stat-pill">
          XP <b className="mono">{totalXp}</b>
        </span>
        <button className="btn btn--ghost btn--sm" onClick={onOpenScan}>
          Scan Data
        </button>
      </div>
    </div>
  );
}
