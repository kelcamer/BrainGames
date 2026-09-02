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

export default function GameGrid({ xp, onPlay, lastPlayed = {} }) {
  // every drill (region primaries + secondary drills) as one flat list…
  const cards = [
    ...Object.entries(REGIONS).map(([key, r]) => ({ regionKey: key, gameId: r.game, title: r.label })),
    ...EXTRA_GAMES.map((g) => ({ regionKey: g.regionKey, gameId: g.gameId, title: g.title })),
  ];
  // …ordered most-recently-played first. Sort is stable, so never-played drills
  // keep their original order (all tie at 0) and sit after the ones you've played.
  const ordered = cards.slice().sort((a, b) => (lastPlayed[b.gameId] || 0) - (lastPlayed[a.gameId] || 0));

  return (
    <div className="game-grid">
      {ordered.map((c) => (
        <GameCard key={c.gameId} regionKey={c.regionKey} gameId={c.gameId} title={c.title} xp={xp[c.regionKey] || 0} onPlay={onPlay} />
      ))}
    </div>
  );
}
