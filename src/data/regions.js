// Region → primary drill mapping, plus the extra drills that share a region's XP pool.
// XP always flows into the *region*, never the game — a region can have more than one drill.

export const XP_PER_LEVEL = 150;

export const REGIONS = {
  // The three regions the audited scan (24 Sep 2026) puts lowest on surface area.
  orbitofrontal: { name: "Orbitofrontal Cortex", color: "var(--orbitofrontal)", game: "switchback", label: "SWITCHBACK" },
  scene: { name: "Parahippocampal Cortex", color: "var(--scene)", game: "wherewasit", label: "WHERE WAS IT?" },
  temporalpole: { name: "Temporal Pole", color: "var(--temporalpole)", game: "whoswho", label: "WHO'S WHO" },
  // Added 29 Sep 2026: left entorhinal is 10th percentile (surface area) against both same-software groups.
  entorhinal: { name: "Entorhinal Cortex", color: "var(--entorhinal)", game: "wherewhen", label: "WHERE & WHEN" },
  visual: { name: "Visual Cortex", color: "var(--visual)", game: "flashfocus", label: "FLASH FOCUS" },
  auditory: { name: "Auditory Cortex", color: "var(--auditory)", game: "tonetrace", label: "TONE TRACE" },
  motor: { name: "Motor Cortex", color: "var(--motor)", game: "motorchain", label: "MOTOR CHAIN" },
  wordform: { name: "Word-Form Area", color: "var(--wordform)", game: "wordblitz", label: "WORD BLITZ" },
  hippocampus: { name: "Hippocampus", color: "var(--hippocampus)", game: "tracemap", label: "CARD CATALOG" },
  parietal: { name: "Parietal Cortex Network", color: "var(--parietal)", game: "blockbuilder", label: "BLOCK BUILDER" },
  executive: { name: "Prefrontal Executive Network", color: "var(--executive)", game: "gonogo", label: "GO / NO-GO" },
};

// Secondary drills for a region that already has a primary card above.
export const EXTRA_GAMES = [
  { regionKey: "visual", gameId: "drift", title: "DRIFT" },
  { regionKey: "hippocampus", gameId: "tracemaphard", title: "TRACE MAP" },
  { regionKey: "hippocampus", gameId: "constellation", title: "CONSTELLATION" },
  { regionKey: "scene", gameId: "wayfinder", title: "WAYFINDER" },
  { regionKey: "motor", gameId: "rhythmrecall", title: "RHYTHM RECALL" },
  { regionKey: "parietal", gameId: "magicnumber", title: "MAGIC NUMBER" },
  { regionKey: "executive", gameId: "nback", title: "N-BACK" },
  { regionKey: "executive", gameId: "taskswitch", title: "TASK SWITCH" },
  { regionKey: "executive", gameId: "wordrush", title: "WORD RUSH" },
  { regionKey: "executive", gameId: "ebbflow", title: "EBB AND FLOW" },
  { regionKey: "executive", gameId: "openloops", title: "OPEN LOOPS" },
];

export const GAME_BLURB = {
  switchback:
    "Two cards. One pays off most of the time, the other rarely — but not always, so a single loss proves nothing. Once you've locked on, the payoffs quietly swap. Notice and switch. This is probabilistic reversal learning, the standard orbitofrontal task: people with orbitofrontal damage keep picking the old winner (Fellows & Farah 2003). Left lateral orbitofrontal is 12th percentile on the scan.",
  wherewasit:
    "Objects turn up one at a time, each inside a different room. Then: which room was each one in — or was it never shown? Remembering the context something happened in is the parahippocampal cortex's part of memory (Diana, Yonelinas & Ranganath 2007). Left parahippocampal is 5.8th percentile on the scan.",
  wherewhen:
    "A day at home plays out: objects turn up one by one, each in a room. Then, for each one: which room, and when in the day did it appear? Binding an item to its place AND its moment is the entorhinal cortex's job — the gateway into memory; its lateral part tracks time within an experience (Montchal, Reagh & Yassa 2019). The everyday version: \"where did I put my keys, and was that before or after I came in?\" Left entorhinal is 10th percentile (surface area) on the scan against both comparison groups — the least certain of the lows.",
  whoswho:
    "Faces with made-up first names — study them at your own pace, then name each one. The wrong answers are the other faces' names. Starts at 5 faces; every run at 90%+ adds one. Putting a name to a face is the job the left temporal pole is best known for (Damasio et al. 1996). Left temporal pole is 1st percentile on the scan.",
  flashfocus:
    "Spot the odd-angled tile before it's gone. Trains rapid orientation discrimination — a core V1 function.",
  drift:
    "A cloud of dots — some drifting together, the rest scattering at random. Call the drift direction. Every right call makes the drift fainter, so the run converges on your motion-coherence threshold. Read it against your own past runs — lab studies quote 5-15% on calibrated screens with an easier noise type, and this one re-rolls every dot every frame so none can be tracked. Global motion is pooled in V5/MT off pericalcarine and lateral-occipital input — the one thing no other drill here touches. Those regions measure large on the audited scan (left pericalcarine 97th), so this plays to a strength.",
  tonetrace: "Repeat growing tone sequences, or call the higher pitch. Trains raw auditory discrimination.",
  motorchain:
    "Learn a directional sequence and watch your reaction time drop with reps — literal procedural learning. Left precentral (motor) cortex is 19th percentile on the scan.",
  wordblitz: "Catch a flashed word, or beat the ink-color Stroop trap. Trains rapid visual word-form recognition.",
  tracemap:
    "Watch shapes appear on a grid, hold them through a delay, then place them back from memory. Trains hippocampal spatial/episodic memory.",
  tracemaphard:
    "Identical blank tiles light up in a growing sequence — no shape, no color, nothing to whisper to yourself. This is the real Corsi block-tapping test, the clinical standard for spatial memory span.",
  rhythmrecall:
    "A Simon-says drum kit. I play a beat, you play it back, and every round adds one more hit and nudges the tempo up. Beat-based timing runs through the putamen and motor cortex (Grahn & Brett 2007), so this counts as a motor drill, not a memory one. Left precentral (motor) cortex is 19th percentile on the scan.",
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
    "Explore a landmark map with no overview, then make deliveries and call bearings entirely from memory. No minimap, no route arrow — the same allocentric map-building that grew London taxi drivers' hippocampi. Landmarks are parahippocampal territory (Epstein & Kanwisher 1998), so this now feeds the Parahippocampal pool.",
  openloops:
    "Sort a stream of items while holding delayed intentions — \"when you see the fox, press ⭐.\" The cue appears trials later, through interference, with the reminder hidden. Prospective memory, the rostral-PFC system behind \"sure, I'll do it\" → forgot.",
};

// Which region's XP pool each drill feeds — derived once so App.jsx doesn't
// need a parallel switch statement.
export const GAME_REGION = {
  switchback: "orbitofrontal",
  wherewasit: "scene",
  whoswho: "temporalpole",
  wherewhen: "entorhinal",
  flashfocus: "visual",
  drift: "visual",
  tonetrace: "auditory",
  motorchain: "motor",
  wordblitz: "wordform",
  tracemap: "hippocampus",
  tracemaphard: "hippocampus",
  rhythmrecall: "motor",
  constellation: "hippocampus",
  magicnumber: "parietal",
  blockbuilder: "parietal",
  gonogo: "executive",
  nback: "executive",
  taskswitch: "executive",
  wordrush: "executive",
  ebbflow: "executive",
  wayfinder: "scene",
  openloops: "executive",
};

export function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
