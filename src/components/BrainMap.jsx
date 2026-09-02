const NODES = [
  { region: "visual", cx: 95, cy: 150, delay: "0s" },
  { region: "auditory", cx: 150, cy: 205, delay: "-.6s" },
  { region: "motor", cx: 230, cy: 138, delay: "-1.2s" },
  { region: "wordform", cx: 172, cy: 228, delay: "-1.8s" },
  { region: "hippocampus", cx: 128, cy: 172, delay: "-2.4s" },
];

const CALLOUTS = [
  {
    region: "visual",
    title: "Visual cortex",
    stat: "0.01st percentile · left pericalcarine thickness",
    body: "Primary sight processing (pericalcarine, cuneus, lateral occipital, lingual gyrus) is thin across the board — the single most extreme cluster on the whole scan.",
  },
  {
    region: "auditory",
    title: "Auditory cortex",
    stat: "1.8th %ile thickness (R) · 99.9th %ile surface area (L)",
    body: "Heschl's gyrus, where raw sound first gets processed, is thin on both sides — but its surface area is enormous (left 99.9th percentile). Thin and wide, not simply small.",
  },
  {
    region: "motor",
    title: "Putamen",
    stat: "0.7th percentile · right putamen volume",
    body: "The striatal structure behind motor sequencing and habit automation is small on both sides.",
  },
  {
    region: "wordform",
    title: "Word-form area",
    stat: "0.02nd percentile · right fusiform thickness",
    body: "Right fusiform is thin, not small — its surface area is average (47.7th). Ties to rapid visual word/face recognition.",
  },
  {
    region: "hippocampus",
    title: "Hippocampus",
    stat: "19.6th percentile · right hippocampus volume",
    body: "Not extreme like the four above — but it's your weakest structure outside them (left 26.0th). Handles episodic and spatial memory encoding.",
  },
];

export default function BrainMap() {
  return (
    <div className="scope-section">
      <div className="scope-svg-wrap">
        <div className="scope-sweep" aria-hidden="true" />
        <svg viewBox="0 0 400 300" width="100%" height="auto" role="img" aria-label="Stylized brain diagram with five highlighted regions">
          <path
            d="M100,30 C150,6 230,6 275,32 C318,54 350,88 344,128 C362,150 366,180 344,196 C350,216 334,226 313,220 C304,246 278,256 253,250 C244,270 213,276 193,260 C168,268 142,258 132,240 C98,236 72,214 68,184 C48,174 44,148 60,128 C44,108 54,82 80,63 C90,44 106,44 100,30 Z"
            fill="var(--panel-2)"
            stroke="var(--line-bright)"
            strokeWidth="1.5"
          />
          <path
            d="M198,252 C196,264 202,278 214,286 C226,292 236,282 232,268 C228,256 216,248 198,252 Z"
            fill="var(--panel-2)"
            stroke="var(--line-bright)"
            strokeWidth="1.5"
          />
          {NODES.map((n) => (
            <g className="node" key={n.region}>
              <circle className="ring" cx={n.cx} cy={n.cy} r="12" fill="none" stroke={`var(--${n.region})`} strokeWidth="2" style={{ animationDelay: n.delay }} />
              <circle cx={n.cx} cy={n.cy} r="6" fill={`var(--${n.region})`} />
            </g>
          ))}
        </svg>
        <div className="scope-caption">illustrative side-profile — not anatomically exact placement</div>
      </div>

      <div className="callout-list">
        {CALLOUTS.map((c) => (
          <div className="callout" style={{ "--r": `var(--${c.region})` }} key={c.region}>
            <span className="swatch" />
            <div>
              <h3>{c.title}</h3>
              <div className="headline-stat">{c.stat}</div>
              <p>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
