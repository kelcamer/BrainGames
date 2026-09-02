export default function GameHeader({ color, regionLabel, title, onBack, children }) {
  return (
    <div className="game-header">
      <div>
        <span className="region-label" style={{ color }}>
          {regionLabel}
        </span>
        <h2 className="display">{title}</h2>
      </div>
      <div className="game-hud">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>
          ← Console
        </button>
        {children}
      </div>
    </div>
  );
}
