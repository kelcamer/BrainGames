// Pixel animal faces for Where & When, on a 32x32 grid. Each animal is a list of
// simple shapes (ellipses, triangles, single pixels) that get rasterised to
// pixels, so curves come out smooth. `mirror` copies a shape to the right half
// (faces are symmetric about x = 16). Order: `body` shapes, then a 1-pixel
// outline is traced around them, then `face` shapes (eyes, blush, nose) on top.

const N = 32;
const K = "#3a3150"; // outline
const E = "#140e1f"; // eyes
const W = "#ffffff";
const P = "#ff9fb4"; // blush

const ell = (cx, cy, rx, ry, c, mirror = false) => ({ t: "e", cx, cy, rx, ry, c, mirror });
const tri = (pts, c, mirror = false) => ({ t: "t", pts, c, mirror });
const px = (list, c, mirror = false) => ({ t: "p", list, c, mirror });

// Shared face: big eyes with a sparkle, blush, small nose and a "w" mouth.
const eyes = (cx = 11.5, cy = 18, rx = 1.9, ry = 2.5) => [ell(cx, cy, rx, ry, E, true), px([[Math.floor(cx) - 1, Math.floor(cy) - 2]], W, true)];
const blush = (cy = 21.5) => [ell(8.3, cy, 2, 1.1, P, true)];
const mouth = (y = 22, c = E) => [px([[14, y], [15, y + 1]], c, true)];
const nose = (c, cy = 20.6) => [ell(16, cy, 1.3, 0.9, c)];
const head = (c, cy = 19, rx = 12, ry = 10) => ell(16, cy, rx, ry, c);

export const ANIMALS = [
  {
    name: "cat",
    body: [tri([[5, 16], [7, 3], [15, 10]], "#f4a259", true), tri([[7.5, 12], [8.5, 6], [12.5, 10]], "#ffc6d0", true), head("#f4a259"), ell(16, 23, 4.5, 2.6, "#ffe3c4")],
    face: [...eyes(), ...blush(), ...nose("#ff7f96"), ...mouth()],
  },
  {
    name: "bunny",
    body: [ell(11, 7, 2.8, 7.5, "#f6f1ec", true), ell(11, 7.5, 1.3, 5.5, "#ffc6d0", true), head("#f6f1ec", 20, 11.5, 9.5)],
    face: [...eyes(11.5, 19), ...blush(22.5), ...nose("#ff7f96", 21.6), ...mouth(23)],
  },
  {
    name: "bear",
    body: [ell(7, 10, 4, 4, "#b07b4f", true), ell(7, 10, 2, 2, "#e8c39a", true), head("#b07b4f"), ell(16, 23, 5, 3.3, "#e8c39a")],
    face: [...eyes(), ...blush(), ell(16, 21.3, 1.8, 1.1, E), ...mouth(23)],
  },
  {
    name: "panda",
    body: [ell(7, 10, 4, 4, "#2e2a36", true), head("#f7f7f2"), ell(11, 18.8, 3.3, 3.9, "#2e2a36", true)],
    face: [ell(11.5, 18.5, 1.6, 2.1, "#08060c", true), px([[10, 16], [10, 17]], W, true), ...blush(22.5), ell(16, 21.3, 1.5, 1, E), ...mouth(23)],
  },
  {
    name: "fox",
    body: [tri([[4, 16], [5, 2], [14, 10]], "#f08a3c", true), tri([[6.5, 12], [6.8, 5.5], [11.5, 10]], "#5a3a2a", true), head("#f08a3c"), ell(10.5, 23, 5, 3.3, "#fffaf2", true)],
    face: [...eyes(), ...blush(), ell(16, 21.2, 1.5, 1, E), ...mouth(22.5)],
  },
  {
    name: "frog",
    body: [ell(10, 11, 4.5, 4.3, "#7cc46a", true), head("#7cc46a", 20.5, 13, 9)],
    face: [
      ell(10, 11, 3, 2.9, W, true), ell(10.5, 11.5, 1.6, 1.9, E, true), px([[9, 9]], W, true),
      ...blush(20.5),
      px([[11, 21], [12, 22], [13, 23], [14, 23], [15, 23]], "#2f6b3a", true),
    ],
  },
  {
    name: "pig",
    body: [tri([[5, 13], [6, 5], [13, 10]], "#f7b6c2", true), tri([[7, 11], [7.5, 7], [11, 10]], "#e88fa3", true), head("#f7b6c2"), ell(16, 22.5, 4.2, 3, "#e88fa3")],
    face: [...eyes(11, 17.5), ...blush(21.5), px([[14, 22], [14, 23]], "#a8506a", true)],
  },
  {
    name: "mouse",
    body: [ell(7.5, 9, 5.5, 5.5, "#b9bccb", true), ell(7.5, 9, 3.3, 3.3, "#ffc6d0", true), head("#b9bccb", 20, 11, 9.5)],
    face: [...eyes(12, 19), ...blush(22), ...nose("#ff7f96", 21.4), ...mouth(22.8)],
  },
  {
    name: "chick",
    body: [ell(15, 7, 1.4, 3.2, "#ffd93d", true), head("#ffd93d", 19, 11.5, 10.5)],
    face: [...eyes(), ...blush(), tri([[13.5, 20], [18.5, 20], [16, 23.2]], "#ff9a3c")],
  },
  {
    name: "penguin",
    body: [head("#3b4a6b", 18.5, 12, 11), ell(12.3, 20, 5.2, 6.8, "#fbfbff", true)],
    face: [...eyes(12, 18), ...blush(22), tri([[14, 20.5], [18, 20.5], [16, 23]], "#ff9a3c")],
  },
  {
    name: "koala",
    body: [ell(6, 12, 5.5, 5.5, "#9aa3ad", true), ell(6.2, 12.3, 3.4, 3.4, "#eceef2", true), head("#9aa3ad", 19.5, 11.5, 10)],
    face: [...eyes(11, 18), ...blush(22.5), ell(16, 21.5, 2.5, 3.3, "#3a3a4a")],
  },
  {
    name: "tiger",
    body: [
      tri([[5, 14], [7, 5], [14, 10]], "#f7a440", true), tri([[7.5, 12], [8.3, 7.5], [12, 10]], "#fff3dc", true), head("#f7a440"), ell(16, 23, 5.2, 3.2, "#fffaf2"),
      px([[15, 10], [15, 11], [15, 12], [16, 10], [16, 11], [16, 12], [12, 10], [12, 11], [5, 18], [6, 18], [7, 18], [5, 21], [6, 21]], "#3a2a2a", true),
    ],
    face: [...eyes(), ...blush(), ...nose("#ff7f96", 21.2), ...mouth(22.5)],
  },
  {
    name: "cow",
    body: [
      ell(4, 15, 3.8, 1.9, "#f7f4ee", true), tri([[9, 11], [10, 5], [12.5, 10]], "#e8d8b0", true), head("#f7f4ee"),
      ell(9.5, 13.5, 3.5, 2.8, "#6b4a3a"), ell(23, 17, 2.2, 2.6, "#6b4a3a"), ell(16, 24.5, 7.5, 3.6, "#f5b3c0"),
    ],
    face: [...eyes(11.5, 18.5), ...blush(21.5), px([[13, 24], [13, 25]], "#a8506a", true)],
  },
  {
    name: "sheep",
    body: [
      ell(5, 16, 3.5, 1.8, "#e0c7ad", true),
      ell(16, 10, 5, 4, "#fbf7ef"), ell(10, 11, 4, 3.6, "#fbf7ef", true), ell(6.5, 15, 3.4, 3.4, "#fbf7ef", true),
      head("#e9d6c3", 20.5, 9, 8.5), ell(16, 12.5, 7, 3, "#fbf7ef"),
    ],
    face: [...eyes(12.5, 19.5, 1.7, 2.2), ...blush(22.5), ...nose("#ff7f96", 22), ...mouth(23.2)],
  },
  {
    name: "owl",
    body: [tri([[5, 13], [6, 4], [12, 10]], "#9c6b45", true), head("#9c6b45", 19, 12, 10.5), ell(11, 18, 4.4, 4.4, "#f3e2c7", true)],
    face: [...eyes(11, 18, 2.5, 2.8), tri([[14.5, 21], [17.5, 21], [16, 24]], "#f6b93b")],
  },
  {
    name: "puppy",
    body: [head("#e0b07a", 18.5, 11, 10.5), ell(5.5, 18, 3.5, 7, "#8a5a3a", true), ell(16, 23, 4.8, 3.2, "#f6e1c4")],
    face: [...eyes(12, 18), ...blush(22), ell(16, 21.3, 1.8, 1.2, E), ...mouth(23)],
  },
];

// ---- rasteriser -----------------------------------------------------------

function inside(s, x, y) {
  if (s.t === "e") return ((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2 <= 1;
  const [[ax, ay], [bx, by], [cx, cy]] = s.pts;
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
  const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
  const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

function mirrored(s) {
  if (s.t === "e") return { ...s, cx: N - s.cx };
  if (s.t === "t") return { ...s, pts: s.pts.map(([x, y]) => [N - x, y]) };
  return { ...s, list: s.list.map(([x, y]) => [N - 1 - x, y]) };
}

function paint(grid, shapes) {
  for (const s0 of shapes) {
    for (const s of s0.mirror ? [s0, mirrored(s0)] : [s0]) {
      if (s.t === "p") {
        for (const [x0, y0] of s.list) {
          const x = Math.floor(x0);
          const y = Math.floor(y0);
          if (x >= 0 && x < N && y >= 0 && y < N) grid[y][x] = s.c;
        }
        continue;
      }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inside(s, x + 0.5, y + 0.5)) grid[y][x] = s.c;
    }
  }
}

const cache = new Map();

// 32 rows of 32 colours (null = transparent).
export function rasterize(a) {
  if (cache.has(a.name)) return cache.get(a.name);
  const grid = Array.from({ length: N }, () => Array(N).fill(null));
  paint(grid, a.body);
  const filled = grid.map((row) => row.map((c) => c !== null));
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (!filled[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled[y + dy]?.[x + dx])) grid[y][x] = K;
  paint(grid, a.face);
  cache.set(a.name, grid);
  return grid;
}

export const GRID = N;
