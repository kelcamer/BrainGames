import { useMemo } from "react";
import { randomPraise } from "../data/praise.js";

export default function SessionSummary({ eyebrow, bigNum, detail, onAgain, againLabel = "Play Again", onBack }) {
  // one encouragement per results screen (picked once when it mounts)
  const praise = useMemo(() => randomPraise(), []);
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
