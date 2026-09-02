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

