// Region → primary drill mapping, plus the extra drills that share a region's XP pool.
// XP always flows into the *region*, never the game — a region can have more than one drill.

export const XP_PER_LEVEL = 150;

export const REGIONS = {
  visual: { name: "Visual Cortex", color: "var(--visual)", game: "flashfocus", label: "FLASH FOCUS" },
  auditory: { name: "Auditory Cortex", color: "var(--auditory)", game: "tonetrace", label: "TONE TRACE" },
  motor: { name: "Putamen (Motor)", color: "var(--motor)", game: "motorchain", label: "MOTOR CHAIN" },
  wordform: { name: "Word-Form Area", color: "var(--wordform)", game: "wordblitz", label: "WORD BLITZ" },
  hippocampus: { name: "Hippocampus", color: "var(--hippocampus)", game: "tracemap", label: "TRACE MAP" },
};

// Secondary drills for a region that already has a primary card above.
export const EXTRA_GAMES = [
  { regionKey: "hippocampus", gameId: "tracemaphard", title: "TRACE MAP: HARD MODE" },
  { regionKey: "hippocampus", gameId: "rhythmrecall", title: "RHYTHM RECALL" },
  { regionKey: "hippocampus", gameId: "constellation", title: "CONSTELLATION" },
  { regionKey: "hippocampus", gameId: "magicnumber", title: "MAGIC NUMBER" },
  { regionKey: "hippocampus", gameId: "blockbuilder", title: "BLOCK BUILDER" },
];

export const GAME_BLURB = {
  flashfocus:
    "Spot the odd-angled tile before it's gone. Trains rapid orientation discrimination — a core V1 function.",
  tonetrace: "Repeat growing tone sequences, or call the higher pitch. Trains raw auditory discrimination.",
  motorchain:
    "Learn a directional sequence and watch your reaction time drop with reps — literal procedural learning.",
  wordblitz: "Catch a flashed word, or beat the ink-color Stroop trap. Trains rapid visual word-form recognition.",
  tracemap:
    "Watch shapes appear on a grid, hold them through a delay, then place them back from memory. Trains hippocampal spatial/episodic memory.",
  tracemaphard:
    "Identical blank tiles light up in a growing sequence — no shape, no color, nothing to whisper to yourself. This is the real Corsi block-tapping test, the clinical standard for spatial memory span.",
  rhythmrecall:
    "A Simon-says drum kit. I play a beat, you play it back, and every round adds one more hit and nudges the tempo — the working-memory-to-motor-pattern handoff, live.",
  constellation:
    "A set of squares flashes at once — pick the same set back. Get it right and the count climbs by one and the grid grows a size. A simultaneous visuospatial span test, not a sequence — closer to change-detection capacity tasks than Corsi.",
  magicnumber:
    "A number flashes, the screen blanks for a few seconds, then you type it back. Every clean recall adds a digit. The classic forward digit-span test — verbal working memory held across a delay; average adult span is about seven.",
  blockbuilder:
    "A 3D stack of cubes appears (with real gravity — nothing floats). Pick what it looks like from the back, left, or right. Trains mental rotation and perspective-taking — allocentric spatial reasoning, straight out of the old Cyberchase block puzzles.",
};

// Which region's XP pool each drill feeds — derived once so App.jsx doesn't
// need a parallel switch statement.
export const GAME_REGION = {
  flashfocus: "visual",
  tonetrace: "auditory",
  motorchain: "motor",
  wordblitz: "wordform",
  tracemap: "hippocampus",
  tracemaphard: "hippocampus",
  rhythmrecall: "hippocampus",
  constellation: "hippocampus",
  magicnumber: "hippocampus",
  blockbuilder: "hippocampus",
};

export function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
