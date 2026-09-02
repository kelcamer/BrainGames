// Web Audio synthesized drum kit — no sample files needed.
// Each drum is built from oscillators + filtered noise bursts.
// Ported from the original Rhythm Recall prototype.

let AC = null;
let MASTER = null;

function ctx() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    MASTER = AC.createGain();
    MASTER.gain.value = 0.9;
    MASTER.connect(AC.destination);
  }
  return AC;
}

/** Resume the audio context (must be called from a user gesture on most browsers). */
export function resume() {
  ctx().resume();
}

/** Current audio clock time. */
export function now() {
  return ctx().currentTime;
}

function master() {
  ctx();
  return MASTER;
}

function noiseBuf(dur) {
  const c = ctx();
  const n = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function env(g, t, a, d, peak) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

const voices = {
  kick(t) {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    env(g, t, 0.004, 0.42, 1.0);
    o.connect(g);
    g.connect(master());
    o.start(t);
    o.stop(t + 0.5);
  },
  snare(t) {
    const c = ctx();
    const s = c.createBufferSource();
    s.buffer = noiseBuf(0.3);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const ng = c.createGain();
    env(ng, t, 0.003, 0.19, 0.7);
    s.connect(hp);
    hp.connect(ng);
    ng.connect(master());
    s.start(t);
    s.stop(t + 0.3);
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(190, t);
    env(og, t, 0.002, 0.12, 0.45);
    o.connect(og);
    og.connect(master());
    o.start(t);
    o.stop(t + 0.2);
  },
  hat(t) {
    const c = ctx();
    const s = c.createBufferSource();
    s.buffer = noiseBuf(0.08);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 8000;
    const g = c.createGain();
    env(g, t, 0.001, 0.05, 0.42);
    s.connect(hp);
    hp.connect(g);
    g.connect(master());
    s.start(t);
    s.stop(t + 0.08);
  },
  ride(t) {
    const c = ctx();
    const s = c.createBufferSource();
    s.buffer = noiseBuf(0.6);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 6000;
    bp.Q.value = 0.6;
    const g = c.createGain();
    env(g, t, 0.002, 0.5, 0.3);
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = "square";
    o.frequency.value = 520;
    env(og, t, 0.002, 0.35, 0.06);
    s.connect(bp);
    bp.connect(g);
    g.connect(master());
    s.start(t);
    s.stop(t + 0.6);
    o.connect(og);
    og.connect(master());
    o.start(t);
    o.stop(t + 0.5);
  },
  crash(t) {
    const c = ctx();
    const s = c.createBufferSource();
    s.buffer = noiseBuf(1.2);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 4000;
    const g = c.createGain();
    env(g, t, 0.003, 1.1, 0.5);
    s.connect(hp);
    hp.connect(g);
    g.connect(master());
    s.start(t);
    s.stop(t + 1.2);
  },
};

/** Trigger a drum by name. Optional `t` schedules it at an audio-clock time. */
export function hit(drum, t) {
  const fn = voices[drum];
  if (fn) fn(t != null ? t : now());
}

export const DRUMS = [
  { id: "kick", label: "Kick", key: "A" },
  { id: "snare", label: "Snare", key: "S" },
  { id: "hat", label: "Hi-Hat", key: "D" },
  { id: "ride", label: "Ride", key: "F" },
  { id: "crash", label: "Crash", key: "G" },
];

export const KEYMAP = { a: "kick", s: "snare", d: "hat", f: "ride", g: "crash" };
