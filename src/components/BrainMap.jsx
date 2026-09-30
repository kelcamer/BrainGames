// The four target regions on the audited scan (24 Sep 2026), all surface area.
// Front of the brain is on the right of the drawing.
const NODES = [
  { region: "orbitofrontal", cx: 306, cy: 186, delay: "0s" },
  { region: "temporalpole", cx: 262, cy: 222, delay: "-.6s" },
  { region: "scene", cx: 180, cy: 214, delay: "-1.2s" },
  { region: "motor", cx: 214, cy: 60, delay: "-1.8s" },
  { region: "entorhinal", cx: 222, cy: 236, delay: "-2.4s" },
];

const CALLOUTS = [
  {
    region: "temporalpole",
    title: "Temporal pole",
    stat: "Left 1st percentile · surface area (likely range 0–6th)",
    body: "Best known for retrieving the names of specific people — damage here leaves people able to describe someone but not name them. Trained by Who's Who.",
  },
  {
    region: "scene",
    title: "Parahippocampal cortex",
    stat: "Left 5.8th percentile · surface area (483 women: 5th)",
    body: "Holds the context around a memory — where you were when something happened, and landmarks. Trained by Where Was It? and Wayfinder.",
  },
  {
    region: "orbitofrontal",
    title: "Orbitofrontal cortex",
    stat: "Left lateral 12.4th · left medial 16th · pars orbitalis R 8.3rd / L 18.6th",
    body: "Tracks whether a choice is still paying off and drives the switch when it stops. Trained by Switchback.",
  },
  {
    region: "entorhinal",
    title: "Entorhinal cortex",
    stat: "Left 10th percentile · surface area vs both same-software groups (10–35 depending on atlas)",
    body: "The gateway into memory: ties an item to where and when it happened before the hippocampus stores it. Trained by Where & When.",
  },
  {
    region: "motor",
    title: "Motor cortex",
    stat: "Left precentral 19.2nd · left caudal middle frontal 14.2nd",
    body: "Sends movement commands and plans movement sequences. Trained by Motor Chain and Rhythm Recall.",
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
