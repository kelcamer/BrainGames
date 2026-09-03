import { useMemo } from "react";
import { randomDyer } from "../data/wayneDyer.js";

export default function SessionSummary({ eyebrow, bigNum, detail, onAgain, againLabel = "Play Again", onBack, praise: praiseOverride, children }) {
  // Default end-of-game reinforcement is a Wayne Dyer quote. Games can still
  // pass their own short line (a broken-streak consolation, a new-best or
  // level-up shout) — that takes the punchy slot instead of a quote.
  const quote = useMemo(() => (praiseOverride ? null : randomDyer()), [praiseOverride]);
  return (
    <div className="summary">
      {praiseOverride ? (
        <span className="praise-line">{praiseOverride}</span>
      ) : (
        <blockquote className="quote-line">
          “{quote}”<cite>— Wayne Dyer</cite>
        </blockquote>
      )}
      <span className="eyebrow">{eyebrow}</span>
      <div className="big-num mono">{bigNum}</div>
      <p>{detail}</p>
      {children}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn--primary" onClick={onAgain}>
          {againLabel}
        </button>
        <button className="btn btn--ghost" onClick={onBack}>
          Back to Console
        </button>
      </div>
    </div>
  );
}
