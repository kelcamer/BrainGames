// Renders a set of "peaks" (landmarks placed at angles around a full circle)
// as seen from one viewing angle — a cheap trig-based stand-in for a real 3D
// camera, good enough to make the same arrangement look genuinely different
// from two different angles (left-right reordering, relative spacing).
//
// Deliberately never culls a landmark by field of view: an earlier version
// hid anything outside a 100° window, which — combined with a 75° rotation
// between study and test — could silently drop a landmark from every choice
// (the actual bug behind "it showed blue, all four choices were orange").
// Landmarks are placed in a compact arc (see FourPeaks.jsx) specifically so
// the full 360° mapping below still reads as one coherent skyline.

function normalize180(deg) {
  return ((deg % 360) + 540) % 360 - 180;
}

function project(landmark, viewAngle) {
  const rel = normalize180(landmark.angle - viewAngle); // -180..180, never dropped
  const xPct = ((rel + 180) / 360) * 100;
  const edgeFactor = 1 - 0.15 * Math.min(1, Math.abs(rel) / 90);
  const scale = landmark.dist * edgeFactor;
  return { xPct, scale, rel };
}

export default function Landscape({ landmarks, viewAngle, size = "big" }) {
  const projected = landmarks
    .map((l) => ({ l, p: project(l, viewAngle) }))
    .sort((a, b) => a.l.dist - b.l.dist); // farthest (smallest dist) painted first

  const vb = { w: 400, h: 200 };
  const baseY = 150;

  return (
    <svg viewBox={`0 0 ${vb.w} ${vb.h}`} className={`peaks-svg peaks-svg--${size}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="peaks-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--panel-3)" />
          <stop offset="100%" stopColor="var(--panel-2)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={vb.w} height={vb.h} fill="url(#peaks-sky)" />
      {projected.map(({ l, p }, i) => {
        const x = (p.xPct / 100) * vb.w;
        const h = l.height * 90 * p.scale;
        const w = 34 * p.scale;
        return <polygon key={i} points={`${x - w},${baseY} ${x},${baseY - h} ${x + w},${baseY}`} fill={l.color} opacity={0.55 + l.dist * 0.45} />;
      })}
      <rect x="0" y={baseY} width={vb.w} height={vb.h - baseY} fill="var(--ground)" opacity="0.5" />
    </svg>
  );
}
