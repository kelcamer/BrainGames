// Region → primary drill mapping, plus the extra drills that share a region's XP pool.
// XP always flows into the *region*, never the game — a region can have more than one drill.

export const XP_PER_LEVEL = 150;

export const REGIONS = {
  visual: { name: "Visual Cortex", color: "var(--visual)", game: "flashfocus", label: "FLASH FOCUS" },
  auditory: { name: "Auditory Cortex", color: "var(--auditory)", game: "tonetrace", label: "TONE TRACE" },
  motor: { name: "Putamen (Motor)", color: "var(--motor)", game: "motorchain", label: "MOTOR CHAIN" },
  wordform: { name: "Word-Form Area", color: "var(--wordform)", game: "wordblitz", label: "WORD BLITZ" },
  hippocampus: { name: "Hippocampus", color: "var(--hippocampus)", game: "tracemap", label: "CARD CATALOG" },
  parietal: { name: "Parietal Cortex Network", color: "var(--parietal)", game: "blockbuilder", label: "BLOCK BUILDER" },
  executive: { name: "Prefrontal Executive Network", color: "var(--executive)", game: "gonogo", label: "GO / NO-GO" },
};

// Secondary drills for a region that already has a primary card above.
export const EXTRA_GAMES = [
  { regionKey: "hippocampus", gameId: "tracemaphard", title: "TRACE MAP" },
  { regionKey: "hippocampus", gameId: "rhythmrecall", title: "RHYTHM RECALL" },
  { regionKey: "hippocampus", gameId: "constellation", title: "CONSTELLATION" },
  { regionKey: "hippocampus", gameId: "wayfinder", title: "WAYFINDER" },
  { regionKey: "parietal", gameId: "magicnumber", title: "MAGIC NUMBER" },
  { regionKey: "executive", gameId: "nback", title: "N-BACK" },
  { regionKey: "executive", gameId: "taskswitch", title: "TASK SWITCH" },
  { regionKey: "executive", gameId: "wordrush", title: "WORD RUSH" },
  { regionKey: "executive", gameId: "ebbflow", title: "EBB AND FLOW" },
  { regionKey: "executive", gameId: "openloops", title: "OPEN LOOPS" },
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
  gonogo:
    "Tap the circles fast, but never the triangles. Trains response inhibition — the withhold-the-impulse skill run by right inferior frontal cortex and the anterior cingulate. The most ADHD-relevant drill here.",
  nback:
    "Letters stream by; press MATCH when the current one equals the letter N steps back. Clear a level and N climbs. The canonical dorsolateral-PFC working-memory task.",
  taskswitch:
    "The rule flips between COLOR and SHAPE — answer by whichever is showing now. Trains cognitive flexibility / set-shifting; the stumble right after a switch is the classic measure.",
  wordrush:
    "One letter, 60 seconds — type as many words as you can that start with it. Phonemic verbal fluency, a left inferior-frontal (Broca's) task with heavy executive retrieval. Plays to a verbal strength.",
  ebbflow:
    "A leaf points one way and drifts another. Green leaf: press where it points. Orange leaf: press where it's drifting. The rule flips with the colour and the two directions often disagree — the Ebb-and-Flow set-shifting task, cognitive flexibility plus response inhibition.",
  wayfinder:
    "Explore a landmark map with no overview, then make deliveries and call bearings entirely from memory. No minimap, no route arrow — the same allocentric map-building that grew London taxi drivers' hippocampi. The closest drill here to what actually moves the needle.",
  openloops:
    "Sort a stream of items while holding delayed intentions — \"when you see the fox, press ⭐.\" The cue appears trials later, through interference, with the reminder hidden. Prospective memory, the rostral-PFC system behind \"sure, I'll do it\" → forgot.",
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
  magicnumber: "parietal",
  blockbuilder: "parietal",
  gonogo: "executive",
  nback: "executive",
  taskswitch: "executive",
  wordrush: "executive",
  ebbflow: "executive",
  wayfinder: "hippocampus",
  openloops: "executive",
};

export function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
