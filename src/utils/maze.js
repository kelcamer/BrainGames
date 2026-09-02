// Perfect-maze generation (randomized recursive backtracker) plus a single
// added shortcut edge that's never revealed during training — the mechanism
// behind Shortcut's "did you build a map, or memorize a habit" test.

function idx(r, c, cols) {
  return r * cols + c;
}

function neighborsOf(i, rows, cols) {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const list = [];
  if (r > 0) list.push(i - cols);
  if (r < rows - 1) list.push(i + cols);
  if (c > 0) list.push(i - 1);
  if (c < cols - 1) list.push(i + 1);
  return list;
}

function areGridAdjacent(a, b, cols) {
  const ar = Math.floor(a / cols), ac = a % cols;
  const br = Math.floor(b / cols), bc = b % cols;
  return (ar === br && Math.abs(ac - bc) === 1) || (ac === bc && Math.abs(ar - br) === 1);
}

function removeWall(a, b, cols, walls) {
  const ar = Math.floor(a / cols), ac = a % cols;
  const br = Math.floor(b / cols), bc = b % cols;
  if (ar === br) {
    if (ac < bc) walls[a].right = false;
    else walls[b].right = false;
  } else {
    if (ar < br) walls[a].bottom = false;
    else walls[b].bottom = false;
  }
}

export function isOpen(walls, cols, a, b) {
  const ar = Math.floor(a / cols), ac = a % cols;
  const br = Math.floor(b / cols), bc = b % cols;
  if (ar === br && Math.abs(ac - bc) === 1) {
    const left = ac < bc ? a : b;
    return !walls[left].right;
  }
  if (ac === bc && Math.abs(ar - br) === 1) {
    const top = ar < br ? a : b;
    return !walls[top].bottom;
  }
  return false;
}

export function getCellWalls(walls, rows, cols, i) {
  const r = Math.floor(i / cols), c = i % cols;
  return {
    top: r === 0 ? true : walls[i - cols].bottom,
    bottom: walls[i].bottom || r === rows - 1,
    left: c === 0 ? true : walls[i - 1].right,
    right: walls[i].right || c === cols - 1,
  };
}

function carvePerfectMaze(rows, cols) {
  const cellCount = rows * cols;
  const walls = Array.from({ length: cellCount }, () => ({ right: true, bottom: true }));
  const visited = new Array(cellCount).fill(false);
  const stack = [0];
  visited[0] = true;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const unvisited = neighborsOf(cur, rows, cols).filter((n) => !visited[n]);
    if (unvisited.length === 0) {
      stack.pop();
      continue;
    }
    const pick = unvisited[Math.floor(Math.random() * unvisited.length)];
    removeWall(cur, pick, cols, walls);
    visited[pick] = true;
    stack.push(pick);
  }
  return walls;
}

export function bfsPath(walls, rows, cols, start, goal) {
  const cellCount = rows * cols;
  const prev = new Array(cellCount).fill(-1);
  const visited = new Array(cellCount).fill(false);
  const queue = [start];
  visited[start] = true;
  while (queue.length) {
    const cur = queue.shift();
    if (cur === goal) break;
    for (const n of neighborsOf(cur, rows, cols)) {
      if (!visited[n] && isOpen(walls, cols, cur, n)) {
        visited[n] = true;
        prev[n] = cur;
        queue.push(n);
      }
    }
  }
  if (!visited[goal]) return null;
  const path = [goal];
  let cur = goal;
  while (cur !== start) {
    cur = prev[cur];
    path.push(cur);
  }
  return path.reverse();
}

function farthestCellFrom(walls, rows, cols, start) {
  const cellCount = rows * cols;
  const dist = new Array(cellCount).fill(-1);
  dist[start] = 0;
  const queue = [start];
  let farthest = start;
  while (queue.length) {
    const cur = queue.shift();
    if (dist[cur] > dist[farthest]) farthest = cur;
    for (const n of neighborsOf(cur, rows, cols)) {
      if (dist[n] === -1 && isOpen(walls, cols, cur, n)) {
        dist[n] = dist[cur] + 1;
        queue.push(n);
      }
    }
  }
  return farthest;
}

/**
 * Builds a maze with a guaranteed genuine shortcut: a wall removed between
 * two cells that sit far apart along the trained path but are grid-adjacent,
 * so a second, shorter route exists that training never reveals.
 * Retries with a fresh maze if no valid shortcut candidate is found.
 */
export function generateShortcutMaze(rows, cols, attempts = 50) {
  // Remember the longest valid (length >= 6) path seen, even if it never got a
  // shortcut — a prior fallback skipped this check entirely and could hand
  // back a degenerate path.
  let bestNoShortcut = null;
  const start = 0; // fixed at a corner — always where the player starts

  for (let attempt = 0; attempt < attempts; attempt++) {
    const walls = carvePerfectMaze(rows, cols);
    // Goal = farthest reachable cell from the FIXED start, via a single BFS.
    // (Do not use the two-BFS "tree diameter" trick here: that finds the
    // farthest pair of points in the whole tree, which can loop back to
    // `start` itself whenever the fixed corner already happens to be one
    // endpoint of that diameter — a corner very often is. That was the
    // actual bug behind goal === start.)
    const goal = farthestCellFrom(walls, rows, cols, start);
    const trainedPath = bfsPath(walls, rows, cols, start, goal);
    if (!trainedPath || trainedPath.length < 6) continue;

    let best = null;
    for (let i = 0; i < trainedPath.length; i++) {
      for (let j = i + 2; j < trainedPath.length; j++) {
        const a = trainedPath[i], b = trainedPath[j];
        if (areGridAdjacent(a, b, cols) && !isOpen(walls, cols, a, b)) {
          const savings = j - i - 1;
          if (!best || savings > best.savings) best = { a, b, savings };
        }
      }
    }
    if (!best) {
      if (!bestNoShortcut || trainedPath.length > bestNoShortcut.trainedPath.length) {
        bestNoShortcut = { walls, rows, cols, start, goal, trainedPath, optimalPath: trainedPath, shortcut: null };
      }
      continue;
    }

    removeWall(best.a, best.b, cols, walls);
    const optimalPath = bfsPath(walls, rows, cols, start, goal);
    return { walls, rows, cols, start, goal, trainedPath, optimalPath, shortcut: best };
  }
  // No maze in `attempts` tries produced a genuine shortcut — use the longest
  // properly-sized path we saw rather than an unfiltered, possibly-degenerate one.
  if (bestNoShortcut) return bestNoShortcut;
  // Truly pathological case (grid too small to ever reach length 6) — generate
  // one more maze unfiltered rather than looping forever.
  const walls = carvePerfectMaze(rows, cols);
  const goal = farthestCellFrom(walls, rows, cols, start);
  const trainedPath = bfsPath(walls, rows, cols, start, goal);
  return { walls, rows, cols, start, goal, trainedPath, optimalPath: trainedPath, shortcut: null };
}
