// Hand-drawn 16x16 pixel animal faces for Where & When. Each sprite is written
// as its LEFT half (8 columns) and mirrored, so every face is symmetric and every
// row is exactly 16 pixels. "." is transparent; other letters index `pal`.
// Shared letters: k outline, e eyes, w white (eye sparkle), p blush.
// Eyes are 2x3 and darker than the outline so they read at small sizes.

const K = "#3a3150";
const E = "#120c1c";
const W = "#ffffff";
const P = "#ff9fb4";

// Most faces share rows 6-15 (eyes, blush, nose, mouth, chin).
const FACE = [
  "kFFFFFFF",
  "kFFFweFF",
  "kFFFeeFF",
  "kFFFeeFF",
  "kFppFFFn",
  "kFFFFFkF",
  "kFFFFFFF",
  ".kFFFFFF",
  "..kkkkkk",
  "........",
];

export const ANIMALS = [
  {
    name: "cat",
    pal: { F: "#f4a259", n: "#ff7f96" },
    rows: ["........", "........", ".k......", ".kk.....", ".kFk....", ".kFFkkkk", ...FACE],
  },
  {
    name: "bunny",
    pal: { F: "#f4efe9", n: "#ff7f96" },
    rows: ["..kk....", ".kFFk...", ".kFpk...", ".kFpk...", ".kFpk...", ".kFFkkkk", ...FACE],
  },
  {
    name: "bear",
    pal: { F: "#b07b4f", d: "#e8c39a", l: "#e8c39a", n: K },
    rows: [
      "........", "........", "........", ".kkk....", "kFdFk...", "kFFFkkkk",
      "kFFFFFFF", "kFFFweFF", "kFFFeeFF", "kFFFeeFF", "kFppFlln", "kFFFFlkl", "kFFFFFll", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "panda",
    pal: { F: "#f7f7f2", n: K },
    rows: [
      "........", "........", "........", ".kkk....", "kkkkk...", "kkkkkkkk",
      "kFFFFFFF", "kFkkwekF", "kFkkeekF", "kFkkeekF", "kFpkkkFn", "kFFFFFkF", "kFFFFFFF", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "fox",
    pal: { F: "#f08a3c", n: K },
    rows: [
      "........", "k.......", "kk......", "kFk.....", "kFFk....", "kFFFkkkk",
      "kFFFFFFF", "kFFFweFF", "kFFFeeFF", "kFFFeeFF", "kFpFFFFn", "kwwwwwkw", "kwwwwwww", ".kwwwwww", "..kkkkkk", "........",
    ],
  },
  {
    name: "frog",
    pal: { F: "#7cc46a" },
    rows: [
      "........", "........", ".kkkkk..", "kwwwwwk.", "kwweewkk", "kFweeFkk",
      "kFFFFFFF", "kFFFFFFF", "kFFFFFFF", "kFppFFFF", "kFFkFFFF", "kFFFkkkk", "kFFFFFFF", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "pig",
    pal: { F: "#f7b6c2", d: "#e88fa3" },
    rows: [
      "........", "........", "........", ".kk.....", ".kdk....", ".kFdkkkk",
      "kFFFFFFF", "kFFFweFF", "kFFFeeFF", "kFFFeeFF", "kFppFddd", "kFFFFdkd", "kFFFFFdd", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "mouse",
    pal: { F: "#b9bccb", d: "#f5a6b8", n: "#ff7f96" },
    rows: ["........", ".kkkk...", "kFFFFk..", "kFddFk..", "kFddFkkk", "kFFFFFFF", ...FACE],
  },
  {
    name: "chick",
    pal: { F: "#ffd93d", b: "#ff9a3c" },
    rows: [
      "........", "........", ".......k", ".......k", "...kkkkk", ".kkFFFFF",
      "kFFFFFFF", "kFFFweFF", "kFFFeeFF", "kFFFeeFF", "kFppFFbb", "kFFFFFFb", "kFFFFFFF", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "penguin",
    pal: { F: "#3b4a6b", b: "#ff9a3c" },
    rows: [
      "........", "........", "........", "........", "...kkkkk", ".kkFFFFF",
      "kFFFFFFF", "kFFwweFF", "kFwweeww", "kFwweeww", "kFwppwbb", "kFwwwwwb", "kFFwwwww", ".kFFwwww", "..kkkkkk", "........",
    ],
  },
  {
    name: "koala",
    pal: { F: "#9aa3ad", d: "#e8e8ee", n: "#3a3a4a" },
    rows: [
      "........", "........", "kkk.....", "kddk....", "kdddk...", "kddkkkkk",
      "kFFFFFFF", "kFFFweFF", "kFFFeeFF", "kFFFeeFn", "kFppFFnn", "kFFFFFnn", "kFFFFFFF", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "tiger",
    pal: { F: "#f7a440", n: "#ff7f96" },
    rows: [
      "........", "........", "........", ".kk.....", ".kFk....", ".kFFkkkk",
      "kFFFFFFk", "kkFFweFF", "kFFFeeFF", "kFFFeeFF", "kFppFwwn", "kkFFwwkw", "kFFFFwww", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "cow",
    pal: { F: "#f7f4ee", s: "#6b4a3a", m: "#f5b3c0", h: "#e8d8b0" },
    rows: [
      "........", "........", "........", "..kk....", "..khk...", "kkkhkkkk",
      "kFssFFFF", "kssFweFF", "kFFFeeFF", "kFFFeeFF", "kFppFFFF", "kFmmmmmm", "kFmmmkmm", ".kmmmmmm", "..kkkkkk", "........",
    ],
  },
  {
    name: "sheep",
    pal: { F: "#e9d6c3", n: "#ff7f96" },
    rows: [
      "........", "..kk.kk.", ".kwwkwwk", "kwwwwwww", "kwwwwwww", "kwwkkkkk",
      "kwkFFFFF", "kwkFweFF", "kkFFeeFF", "kkFFeeFF", "kFppFFFn", "kFFFFFkF", ".kFFFFFF", "..kFFFFF", "...kkkkk", "........",
    ],
  },
  {
    name: "owl",
    pal: { F: "#9c6b45", l: "#f3e2c7", b: "#f6b93b" },
    rows: [
      "........", "........", ".k......", ".kk.....", ".kFk....", ".kFFkkkk",
      "kFFFFFFF", "kFllweFF", "kllweeFF", "kllkeeFF", "kFllllbb", "kFFFFFFb", "kFFFFFFF", ".kFFFFFF", "..kkkkkk", "........",
    ],
  },
  {
    name: "puppy",
    pal: { F: "#e0b07a", d: "#8a5a3a", n: K },
    rows: [
      "........", "........", "........", "........", "..kkkkkk", ".kkFFFFF",
      "kddkFFFF", "kddkweFF", "kddkeeFF", "kddkeeFF", ".kkpFFFn", "..kFFFkF", "..kFFFFF", "...kFFFF", "....kkkk", "........",
    ],
  },
];

// Expand a sprite to 16 full rows (left half + its mirror).
export function spriteRows(a) {
  return a.rows.map((h) => h + h.split("").reverse().join(""));
}

export function spriteColor(a, ch) {
  if (ch === "k") return K;
  if (ch === "e") return E;
  if (ch === "w") return W;
  if (ch === "p") return P;
  return a.pal[ch];
}
