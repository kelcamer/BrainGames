// Renders landmarks placed in a 2D world (x = lateral position, z = depth)
// as seen from a camera at lateral position `camX`, using real perspective
// projection — not a stand-in, this is the actual math.
//
// This matters: an earlier version orbited a single camera around a fixed
// ring of landmarks, equivalent to panning the whole picture sideways —
// every landmark shifts by the same amount, so relative left-right order
// never changes no matter how far the "camera" moves. That could be (and
// was) solved by memorizing the silhouette alone, since the test never
// actually punished it. Real motion parallax needs landmarks at different
// DEPTHS to shift by different amounts as the camera moves — near ones
// sweep across the frame faster than far ones. CAM_Z sits close to the
// landmark field specifically to make that effect strong: verified
// numerically that ~75% of random configurations actually swap left-right
// order between the two camera positions (vs. ~25% with a distant camera),
// so recognizing a rotated skyline actually requires holding the real
// (x, z) arrangement, not a picture.

const CAM_Z = -0.25; // close camera — this closeness is what drives real parallax
export const Z_MAX = 2.2; // landmark depth range: 0 (nearest) .. Z_MAX (farthest) — FourPeaks.jsx generates z in this same range
const VIEW_SCALE = 5.4; // maps world-space screenX to the visible -46%..+46% band

function project(landmark, camX) {
  const relZ = landmark.z - CAM_Z; // always positive — depth in front of camera
  const screenX = (landmark.x - camX) / relZ;
  const xPct = 50 + screenX * VIEW_SCALE;
  // Visual size/haze falloff is intentionally gentler than the strict
  // physical 1/relZ the position math uses above — that ratio would shrink
  // the farthest peaks to near-invisible specks. This is a separate,
  // purely cosmetic depth cue.
  const sizeScale = 1 - 0.45 * (landmark.z / Z_MAX);
  return { xPct, sizeScale };
}

export default function Landscape({ landmarks, camX, size = "big" }) {
  const projected = landmarks
    .map((l) => ({ l, p: project(l, camX) }))
    .sort((a, b) => b.l.z - a.l.z); // farthest painted first, nearest on top

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
        const h = l.height * 90 * p.sizeScale;
        const w = 34 * p.sizeScale;
        return <polygon key={i} points={`${x - w},${baseY} ${x},${baseY - h} ${x + w},${baseY}`} fill={l.color} opacity={0.5 + p.sizeScale * 0.5} />;
      })}
      <rect x="0" y={baseY} width={vb.w} height={vb.h - baseY} fill="var(--ground)" opacity="0.5" />
    </svg>
  );
}
