import { useMemo } from "react";
import { randomPraise } from "../data/praise.js";

export default function SessionSummary({ eyebrow, bigNum, detail, onAgain, againLabel = "Play Again", onBack, praise: praiseOverride }) {
  // one encouragement per results screen (picked once when it mounts). Games
  // whose summary appears on a miss can pass their own line so we don't
  // celebrate a broken streak.
  const praise = useMemo(() => praiseOverride ?? randomPraise(), [praiseOverride]);
  return (
    <div className="summary">
      <span className="praise-line">{praise}</span>
      <span className="eyebrow">{eyebrow}</span>
      <div className="big-num mono">{bigNum}</div>
      <p>{detail}</p>
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
