import { REGIONS, EXTRA_GAMES, GAME_BLURB, XP_PER_LEVEL, levelFromXp } from "../data/regions.js";
import { GAME_ICONS } from "./icons.jsx";

function GameCard({ regionKey, gameId, title, xp, onPlay }) {
  const region = REGIONS[regionKey];
  const Icon = GAME_ICONS[gameId];
  const lvl = levelFromXp(xp);
  const pct = Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
  return (
    <div className="game-card" style={{ "--r": region.color }}>
      <div className="game-card__icon">
        <Icon />
      </div>
      <div className="region-label">{region.name}</div>
      <h3>{title}</h3>
      <p>{GAME_BLURB[gameId]}</p>
      <div className="xp-row">
        <span>Level {lvl}</span>
        <span className="mono">{xp} xp</span>
      </div>
      <div className="xp-bar">
        <div className="xp-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <button className="btn btn--primary" onClick={() => onPlay(gameId)}>
        Play
      </button>
    </div>
  );
}

export default function GameGrid({ xp, onPlay }) {
  return (
    <div className="game-grid">
      {Object.entries(REGIONS).map(([key, r]) => (
        <GameCard key={r.game} regionKey={key} gameId={r.game} title={r.label} xp={xp[key] || 0} onPlay={onPlay} />
      ))}
      {EXTRA_GAMES.map((g) => (
        <GameCard key={g.gameId} regionKey={g.regionKey} gameId={g.gameId} title={g.title} xp={xp[g.regionKey] || 0} onPlay={onPlay} />
      ))}
    </div>
  );
}
