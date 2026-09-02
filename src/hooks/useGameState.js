import { useCallback, useEffect, useState } from "react";
import { levelFromXp } from "../data/regions.js";

const STORAGE_KEY = "cortexConsoleV1";

function defaultState() {
  return {
    xp: { visual: 0, auditory: 0, motor: 0, wordform: 0, hippocampus: 0, parietal: 0 },
    best: {
      flashfocus: { accuracy: 0, minExposure: 9999, plays: 0 },
      tonetrace: { maxSeq: 0, minPitchDiff: 9999, plays: 0 },
      motorchain: { maxSeqLen: 0, bestGainPct: 0, plays: 0 },
      wordblitz: { bestStreak: 0, accuracy: 0, plays: 0 },
      tracemap: { accuracy: 0, maxItems: 0, plays: 0 },
      tracemaphard: { maxSpan: 0, plays: 0 },
      rhythmrecall: { maxRound: 0, plays: 0 },
      constellation: { maxSpan: 0, plays: 0 },
      magicnumber: { maxSpan: 0, plays: 0 },
      blockbuilder: { maxStreak: 0, plays: 0 },
    },
    streak: 0,
    lastPlayDate: null,
    totalSessions: 0,
    badges: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const d = defaultState();
    d.xp = Object.assign(d.xp, parsed.xp || {});
    Object.keys(d.best).forEach((k) => {
      d.best[k] = Object.assign({}, d.best[k], (parsed.best || {})[k] || {});
    });
    d.streak = parsed.streak || 0;
    d.lastPlayDate = parsed.lastPlayDate || null;
    d.totalSessions = parsed.totalSessions || 0;
    d.badges = parsed.badges || [];
    return d;
  } catch {
    return defaultState();
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — session still works, just won't persist */
  }
}

export const BADGES = [
  { id: "first-flash", label: "First Flash", test: (s) => s.best.flashfocus.plays >= 1 },
  { id: "first-tone", label: "First Tone", test: (s) => s.best.tonetrace.plays >= 1 },
  { id: "first-chain", label: "First Chain", test: (s) => s.best.motorchain.plays >= 1 },
  { id: "first-word", label: "First Word", test: (s) => s.best.wordblitz.plays >= 1 },
  { id: "first-trace", label: "First Trace", test: (s) => s.best.tracemap.plays >= 1 },
  { id: "first-hard", label: "First Hard Mode Run", test: (s) => s.best.tracemaphard.plays >= 1 },
  { id: "corsi-adult", label: "Corsi Span 5 (Adult Avg)", test: (s) => s.best.tracemaphard.maxSpan >= 5 },
  { id: "first-rhythm", label: "First Beat", test: (s) => s.best.rhythmrecall.plays >= 1 },
  { id: "rhythm-maxtempo", label: "Max Tempo (150 BPM)", test: (s) => s.best.rhythmrecall.maxRound >= 16 },
  { id: "first-constellation", label: "First Constellation Run", test: (s) => s.best.constellation.plays >= 1 },
  { id: "millers-number", label: "Miller's Magic Number (Span 7)", test: (s) => s.best.constellation.maxSpan >= 7 },
  { id: "first-magic", label: "First Magic Number Run", test: (s) => s.best.magicnumber.plays >= 1 },
  { id: "digit-span-7", label: "Digit Span 7 (Adult Avg)", test: (s) => s.best.magicnumber.maxSpan >= 7 },
  { id: "first-block", label: "First Block Builder Run", test: (s) => s.best.blockbuilder.plays >= 1 },
  { id: "block-streak-5", label: "Five Views Straight", test: (s) => s.best.blockbuilder.maxStreak >= 5 },
  { id: "streak-3", label: "3-Day Streak", test: (s) => s.streak >= 3 },
  { id: "streak-7", label: "7-Day Streak", test: (s) => s.streak >= 7 },
  { id: "level-5", label: "Level 5, Any Region", test: (s) => Object.keys(s.xp).some((k) => levelFromXp(s.xp[k]) >= 5) },
  { id: "all-rounder", label: "All-Rounder", test: (s) => Object.keys(s.xp).every((k) => s.xp[k] > 0) },
];

function withStreakUpdate(state) {
  const today = new Date().toDateString();
  if (state.lastPlayDate === today) return state;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const streak = state.lastPlayDate === yesterday ? state.streak + 1 : 1;
  return { ...state, streak, lastPlayDate: today, totalSessions: state.totalSessions + 1 };
}

function withBadgesChecked(state) {
  const unlocked = new Set(state.badges);
  let changed = false;
  BADGES.forEach((b) => {
    if (!unlocked.has(b.id) && b.test(state)) {
      unlocked.add(b.id);
      changed = true;
    }
  });
  return changed ? { ...state, badges: Array.from(unlocked) } : state;
}

/**
 * Central game state: XP per region, per-game best stats, streak, badges.
 * Every drill calls `finishSession` exactly once, at the end of a run.
 */
export function useGameState() {
  const [state, setState] = useState(load);

  useEffect(() => {
    save(state);
  }, [state]);

  // gameId: which drill (keys state.best); region: which XP pool it feeds;
  // xpEarned: amount to add (0 to skip); updateBest: (prevBestForGame) => nextBestForGame (omit to skip).
  // registerSession defaults true — pass false for a lightweight mid-round XP tick
  // (e.g. Pitch Duel's per-correct-guess bump) that shouldn't count as its own session/streak tick.
  const recordProgress = useCallback((gameId, region, xpEarned, updateBest, registerSession = true) => {
    setState((prev) => {
      let next = { ...prev };
      if (xpEarned) next.xp = { ...next.xp, [region]: (next.xp[region] || 0) + Math.max(0, Math.round(xpEarned)) };
      if (updateBest) next.best = { ...next.best, [gameId]: updateBest({ ...next.best[gameId] }) };
      if (registerSession) {
        next = withStreakUpdate(next);
        next = withBadgesChecked(next);
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setState(defaultState());
  }, []);

  return { state, recordProgress, resetAll };
}
