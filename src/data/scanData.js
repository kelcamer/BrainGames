// Verbatim scan data — 30F, FreeSurfer + Potvin (2016) + CentileBrain (2024),
// self-audited in three independent passes. Nothing here is summarized or rounded further.

export const SUBCORTICAL_VOLUME = [
  ["Thalamus", "10,007.8 mm³", "99.93rd", "9,571.0 mm³", "99.98th"],
  ["Caudate", "4,097.3 mm³", "75.3rd", "3,883.3 mm³", "42.2nd"],
  ["Putamen", "4,683.3 mm³", "3.9th", "4,324.9 mm³", "0.7th"],
  ["Pallidum", "1,944.1 mm³", "42.5th", "1,983.7 mm³", "68.8th"],
  ["Hippocampus", "4,228.9 mm³", "26.0th", "4,250.2 mm³", "19.6th"],
  ["Amygdala", "1,768.0 mm³", "69.2nd", "1,665.6 mm³", "22.8th"],
  ["Nucleus accumbens", "531.2 mm³", "25.4th", "536.5 mm³", "10.1th"],
  ["Ventral DC (Potvin only)", "4,523.8 mm³", "—", "4,925.4 mm³", "—"],
  ["Brainstem, whole (Potvin only)", "23,530.6 mm³", "—", "", ""],
];

export const CORTICAL_THICKNESS = [
  ["Superior frontal", "2.98mm", "81.3rd", "2.99mm", "93.8th"],
  ["Rostral middle frontal", "2.81mm", "~100th", "2.70mm", "~100th"],
  ["Caudal middle frontal", "2.56mm", "8.0th", "2.77mm", "85.5th"],
  ["Pars opercularis (Broca's)", "2.84mm", "91.0th", "2.93mm", "97.7th"],
  ["Pars triangularis (Broca's)", "2.79mm", "97.2nd", "2.92mm", "99.9th"],
  ["Pars orbitalis", "3.24mm", "99.6th", "3.34mm", "99.9th"],
  ["Lateral orbitofrontal", "3.11mm", "~100th", "3.07mm", "99.9th"],
  ["Medial orbitofrontal", "2.95mm", "~100th", "2.83mm", "99.5th"],
  ["Frontal pole", "3.26mm", "94.6th", "3.40mm", "98.9th"],
  ["Fusiform gyrus", "2.71mm", "38.9th", "2.43mm", "0.02nd"],
  ["Pericalcarine (visual)", "1.22mm", "0.01st", "1.50mm", "13.1th"],
  ["Cuneus (visual)", "1.48mm", "0.02nd", "1.71mm", "3.2nd"],
  ["Lateral occipital (visual)", "1.98mm", "0.17th", "2.08mm", "0.63rd"],
  ["Lingual gyrus (visual)", "1.78mm", "0.41st", "1.78mm", "0.21st"],
  ["Transverse temporal (auditory)", "2.23mm", "6.6th", "2.12mm", "1.8th"],
  ["Middle temporal", "3.21mm", "99.37th", "3.26mm", "99.80th"],
  ["Superior temporal", "2.92mm", "58.88th", "3.06mm", "92.26th"],
  ["Inferior temporal", "2.90mm", "80.43rd", "3.03mm", "93.34th"],
  ["Bankssts", "2.77mm", "96.10th", "2.96mm", "98.42nd"],
  ["Inferior parietal", "2.70mm", "98.24th", "2.84mm", "99.91st"],
  ["Isthmus cingulate", "2.43mm", "39.53rd", "2.24mm", "10.55th"],
  ["Insula", "3.05mm", "46.8th", "3.21mm", "84.6th"],
];

export const CORTICAL_SURFACE_AREA = [
  ["Superior frontal", "7,326mm²", "42.4th", "6,544mm²", "8.2nd"],
  ["Rostral middle frontal", "5,347mm²", "12.2nd", "4,980mm²", "1.2nd"],
  ["Caudal middle frontal", "2,111mm²", "17.9th", "2,114mm²", "37.3rd"],
  ["Pars opercularis", "1,623mm²", "41.1st", "1,400mm²", "51.7th"],
  ["Pars triangularis", "1,248mm²", "29.8th", "1,530mm²", "45.9th"],
  ["Pars orbitalis", "674mm²", "48.1st", "684mm²", "3.8th"],
  ["Lateral orbitofrontal", "2,394mm²", "3.0th", "2,507mm²", "22.5th"],
  ["Medial orbitofrontal", "1,783mm²", "20.6th", "1,956mm²", "38.3rd"],
  ["Frontal pole", "279mm²", "89.2nd", "302mm²", "37.3rd"],
  ["Fusiform gyrus", "3,326mm²", "61.4th", "3,153mm²", "47.7th"],
  ["Pericalcarine (visual)", "932mm²", "0.8th", "1,622mm²", "58.5th"],
  ["Cuneus (visual)", "1,170mm²", "1.2nd", "1,710mm²", "71.3rd"],
  ["Transverse temporal (auditory)", "636mm²", "99.9th", "373mm²", "76.2nd"],
  ["Isthmus cingulate", "—", "98.7th", "—", "99.99th"],
  ["Insula", "2,793mm²", "~100th", "2,341mm²", "71.0th"],
];

export const DISCARDED_ARTIFACTS = [
  ["Precentral gyrus (thickness)", "0.0000004th", "0.0000004th", "boundary-ambiguity artifact"],
  ["Paracentral lobule (thickness)", "0.00th", "0.00th", "same artifact family"],
  ["Postcentral gyrus (thickness)", "0.97th", "0.53rd", "same artifact family"],
  ["Entorhinal cortex (area asymmetry)", "28.1th", "95.6th", "unreliable region, no matching thickness asymmetry"],
];
