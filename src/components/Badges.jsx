import { BADGES } from "../hooks/useGameState.js";

export default function Badges({ unlocked }) {
  const have = new Set(unlocked);
  return (
    <div className="badges-row">
      {BADGES.map((b) => (
        <span className={`badge-chip${have.has(b.id) ? " unlocked" : ""}`} key={b.id}>
          <span className="b-dot" />
          {b.label}
        </span>
      ))}
    </div>
  );
}
