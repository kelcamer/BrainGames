// Random optimistic encouragement, shown for a beat whenever a drill is
// answered correctly. Kept short and punchy on purpose — a quick dopamine hit
// between rounds, not a paragraph to read.
const PRAISE = [
  "Nailed it.",
  "Yes! Keep going.",
  "That brain of yours 🔥",
  "Clean. Next!",
  "Locked in.",
  "Sharp as hell.",
  "Boom. Got it.",
  "You're on a roll.",
  "Effortless.",
  "Big brain energy.",
  "Chef's kiss.",
  "Too easy for you.",
  "Flawless.",
  "That's the one!",
  "Crushing it.",
  "Look at you go.",
  "Dialed in.",
  "Unstoppable.",
  "Pure focus.",
  "Yesss 🎯",
  "Smooth.",
  "You've got this.",
  "Brilliant.",
  "One more like that!",
  "Absolute unit.",
  "Snap — correct.",
  "In the zone.",
  "Keep that streak alive.",
];

let last = -1;
// Random praise that never repeats the immediately-previous line, so it doesn't
// feel like a broken loop when you're rattling off correct answers.
export function randomPraise() {
  let i = Math.floor(Math.random() * PRAISE.length);
  if (i === last) i = (i + 1) % PRAISE.length;
  last = i;
  return PRAISE[i];
}

// Encouragement for results screens that appear on a *miss* (e.g. a broken
// span in Trace Map) — celebrating there would be tone-deaf, so these
// keep it warm and forward-looking instead.
const CONSOLATION = [
  "You'll get 'em next time!",
  "So close — go again.",
  "Almost had it!",
  "Nice run. One more?",
  "That's a solid streak.",
  "Shake it off — try again.",
  "Good push. Reset and go.",
  "Next round's yours.",
  "You're getting sharper.",
  "Nearly there — again!",
];

let lastC = -1;
export function randomConsolation() {
  let i = Math.floor(Math.random() * CONSOLATION.length);
  if (i === lastC) i = (i + 1) % CONSOLATION.length;
  lastC = i;
  return CONSOLATION[i];
}

