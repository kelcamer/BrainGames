// Final audited scan record (24 Sep 2026). Age at scan 27, female. Siemens 1.5T,
// T1 SPACE after contrast dye. Percentile = % of healthy women this age measured
// smaller. Source of truth: ~/Downloads/KELSEY_BRAIN_NOTES_BLOCK_FINAL.txt.
//
// CentileBrain: SynthSeg / recon-all-clinical measurements converted to
// FreeSurfer's scale, scored at age 27, corrected for the scanner offset measured
// on 483 healthy women. Like-for-like: direct comparison with those 483 women
// (AOMIC ID1000, ages 20-26), adjusted for head size and age.
// Not used: Potvin 2016, the August FreeSurfer percentiles, cortical thickness.

// [structure, CentileBrain L, CentileBrain R, like-for-like L, like-for-like R]
export const SUBCORTICAL_VOLUME = [
  ["Thalamus", "92.3", "96.6", "95.1", "96.1"],
  ["Caudate", "80.5", "82", "72.9", "74.1"],
  ["Putamen", "79.7", "87.9", "81.2", "89.5"],
  ["Pallidum (low confidence)", "24.1", "41.9", "8.8", "26.3"],
  ["Hippocampus", "56.4", "75.1", "50.7", "72.9"],
  ["Amygdala", "39.9", "60.6", "26.3", "57.9"],
  ["Accumbens", "40.9", "40.3", "43.2", "43.1"],
  ["Ventral DC", "—", "—", "68.5", "52.7"],
  ["Brainstem (whole)", "—", "—", "71.3", ""],
];

// ⚠ = conversion only accurate to ±11-25% for this region
export const CORTICAL_SURFACE_AREA = [
  ["Banks of superior temporal sulcus", "65.2", "32.1", "65.6", "35.8"],
  ["Caudal anterior cingulate", "83.1", "47.8", "78.2", "50"],
  ["Caudal middle frontal", "14.2", "48.5", "20.2", "52.7"],
  ["Cuneus", "70.1", "92.4", "65.9", "87.2"],
  ["Entorhinal ⚠", "15.7", "30.1", "23.2", "30.5"],
  ["Frontal pole ⚠", "40.9", "36.3", "41.2", "37.4"],
  ["Fusiform", "44", "65.3", "48.2", "64.7"],
  ["Inferior parietal", "67.6", "68.6", "67.3", "67.1"],
  ["Inferior temporal", "40.6", "82.5", "49", "80.2"],
  ["Insula", "85.5", "48.5", "79.1", "48.2"],
  ["Isthmus cingulate", "77.2", "98.5", "73.9", "97.2"],
  ["Lateral occipital", "34.8", "72.6", "40.7", "69.1"],
  ["Lateral orbitofrontal", "12.4", "39.4", "19.8", "44.2"],
  ["Lingual", "40.6", "58", "42.6", "59.6"],
  ["Medial orbitofrontal", "16", "56.4", "19.7", "58.6"],
  ["Middle temporal", "37.4", "52", "45", "56.3"],
  ["Paracentral", "62.6", "85.2", "65.2", "86.1"],
  ["Parahippocampal (R ⚠)", "5.8", "50.1", "5", "50.3"],
  ["Pars opercularis (Broca's)", "39", "72.7", "44", "71.7"],
  ["Pars orbitalis", "18.6", "8.3", "22.3", "12"],
  ["Pars triangularis (Broca's)", "34.7", "54.7", "42", "56.5"],
  ["Pericalcarine, primary visual (L ⚠)", "97", "84.8", "95.4", "82"],
  ["Postcentral (touch)", "18.1", "43.4", "28.7", "48.6"],
  ["Posterior cingulate", "56.8", "20", "57.5", "26.7"],
  ["Precentral (motor)", "19.2", "34.8", "28.2", "41.5"],
  ["Precuneus", "66.5", "59.4", "62.2", "57.7"],
  ["Rostral anterior cingulate", "13.8", "72.5", "19.8", "74.2"],
  ["Rostral middle frontal", "63.7", "22.6", "63.2", "34.4"],
  ["Superior frontal", "34.8", "24.4", "45.7", "35.7"],
  ["Superior parietal", "86.4", "31.3", "82.2", "37.9"],
  ["Superior temporal", "24.9", "53.5", "32.4", "58.6"],
  ["Supramarginal", "96.6", "50.8", "91.5", "53.6"],
  ["Temporal pole ⚠", "1", "50.8", "0.6", "48.6"],
  ["Transverse temporal (Heschl's, auditory)", "60.4", "62.1", "63.1", "65.5"],
];

// volBrain gives no percentiles here — only its own inside/outside-normal verdict,
// and only findings flagged in both of its reports are kept.
export const VOLBRAIN_BOTH_REPORTS = [
  ["Left cerebellar white matter", "below normal"],
  ["Postcentral gyrus (total and left)", "below normal"],
  ["Right superior occipital gyrus", "above normal"],
  ["Cerebellum", "right side bigger"],
  ["Ventral DC", "right side bigger"],
  ["Precentral gyrus, medial segment", "right side bigger"],
];

export const WITHDRAWN = [
  ["Thalamus 99.9th, putamen 0.7th / 3.9th", "August FreeSurfer — the contrast dye made these nuclei look like white matter"],
  ["Left insula area 99.96th", "scanner offset — now 85.5th"],
  ["Left Heschl's area 99.9th", "scanner offset — now 60th"],
  ["volBrain gray matter 94th", "flipped to 14th in the second report"],
  ["All cortical thickness percentiles", "not measurable on this scan type"],
  ["All Potvin 2016 percentiles", "fails on healthy controls"],
];
