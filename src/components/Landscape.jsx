// Renders a set of "peaks" (landmarks placed at angles around a full circle)
// as seen from one viewing angle — a cheap trig-based stand-in for a real 3D
// camera, good enough to make the same arrangement look genuinely different
// from two different angles (near/far occlusion, left-right reordering).

const FOV = 100; // degrees of the horizon visible at once

function normalize180(deg) {
  return ((deg % 360) + 540) % 360 - 180;
}

function project(landmark, viewAngle) {
  const rel = normalize180(landmark.angle - viewAngle);
  if (Math.abs(rel) > FOV / 2) return null;
  const xPct = 50 + (rel / (FOV / 2)) * 47;
  const edgeFactor = 1 - 0.3 * (Math.abs(rel) / (FOV / 2));
  const scale = landmark.dist * edgeFactor;
  return { xPct, scale, rel };
}

export default function Landscape({ landmarks, viewAngle, size = "big" }) {
  const projected = landmarks
    .map((l) => ({ l, p: project(l, viewAngle) }))
    .filter((x) => x.p)
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
