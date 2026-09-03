// Genuinely attributed Wayne Dyer quotes, used as the end-of-game reinforcement
// line. These are his widely-published, verifiable lines (from his books and
// talks) — a curated real set rather than a padded one, because inventing
// sayings and attributing them to a real person would be misattribution.
const QUOTES = [
  "When you change the way you look at things, the things you look at change.",
  "How people treat you is their karma; how you react is yours.",
  "You are complete right now. You are a whole, total person — not an apprentice person on the way to someplace else.",
  "When you have the choice between being right and being kind, just choose kind.",
  "When you judge another, you do not define them, you define yourself.",
  "You don't attract what you want. You attract what you are.",
  "Everything is either an opportunity to grow or an obstacle to keep you from growing. You get to choose.",
  "Loving people live in a loving world. Hostile people live in a hostile world. Same world.",
  "Go for it now. The future is promised to no one.",
  "Doing what you love is the cornerstone of having abundance in your life.",
  "The state of your life is nothing more than a reflection of your state of mind.",
  "Our intention creates our reality.",
  "Be miserable, or motivate yourself. Whatever has to be done, it's always your choice.",
  "Self-worth comes from one thing — thinking that you are worthy.",
  "The highest form of ignorance is when you reject something you don't know anything about.",
  "Abundance is not something we acquire. It is something we tune into.",
  "You cannot always control what goes on outside, but you can always control what goes on inside.",
  "If you believe it will work out, you'll see opportunities. If you believe it won't, you'll see obstacles.",
  "Practice being the kind of person you wish to attract.",
  "Peace is the result of retraining your mind to process life as it is, rather than as you think it should be.",
  "I am realistic — I expect miracles.",
  "The measure of your life will not be in what you accumulate, but in what you give away.",
  "Miracles come in moments. Be ready and willing.",
  "You get treated in life the way you teach people to treat you.",
  "Wisdom is avoiding all thoughts that weaken you.",
  "Stop acting as if life is a rehearsal. Live this day as if it were your last.",
  "Blame is a device you use whenever you don't want to take responsibility for something in your life.",
  "Your children will see what you're all about by what you live rather than what you say.",
  "Transformation literally means going beyond your form.",
  "You are not stuck where you are unless you decide to be.",
  "Freedom means you are unobstructed in living your life as you choose.",
  "Love is the willingness to allow those that you care for to be what they choose for themselves.",
  "You'll see it when you believe it.",
  "It's never crowded along the extra mile.",
  "What we think determines what happens to us, so if we want to change our lives, we need to stretch our minds.",
  "Judgments prevent us from seeing the good that lies beyond appearances.",
  "When you dance, your purpose is not to get to a certain place on the floor. It's to enjoy each step along the way.",
  "You leave old habits behind by starting out with the thought: I release the need for this in my life.",
  "Everything you are against weakens you. Everything you are for empowers you.",
  "Conflict cannot survive without your participation.",
  "When the squeeze comes, what comes out of you is what's inside you.",
  "Change your thoughts and you change your life.",
];

let last = -1;
export function randomDyer() {
  let i = Math.floor(Math.random() * QUOTES.length);
  if (i === last) i = (i + 1) % QUOTES.length;
  last = i;
  return QUOTES[i];
}

export const DYER_COUNT = QUOTES.length;
