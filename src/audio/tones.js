// Shared pure-tone synth for Tone Trace (sequence memory + pitch duel).
// Lazily creates one AudioContext, resumed on first user gesture.

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playTone(freq, durationMs = 380) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.03);
  } catch {
    /* audio unavailable — game continues silently */
  }
}
