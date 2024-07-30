const SQUARES = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
];

const defaultMaze = {
  root: 63,
  tree: [
    [1, 2, 3, 4, 5, 6, 7, 15],
    [9, 10, 11, 12, 13, 14, 15, 23],
    [17, 18, 19, 20, 21, 22, 23, 31],
    [25, 26, 27, 28, 29, 30, 31, 39],
    [33, 34, 35, 36, 37, 38, 39, 47],
    [41, 42, 43, 44, 45, 46, 47, 55],
    [49, 50, 51, 52, 53, 54, 55, 63],
    [57, 58, 59, 60, 61, 62, 63, null],
  ],
};

export function getRandomMaze() {
  return scramble(defaultMaze, 1000);
}

export function scramble(maze, n) {
  // console.log("scramble", maze, n)
  let newMaze = { ...maze };
  for (let i = 0; i < n; i++) {
    let rootChoices = [];
    if (newMaze.root % 8 != 0) {
      rootChoices.push(newMaze.root - 1);
    }
    if (newMaze.root % 8 != 7) {
      rootChoices.push(newMaze.root + 1);
    }
    if (newMaze.root >= 8) {
      rootChoices.push(newMaze.root - 8);
    }
    if (newMaze.root <= 55) {
      rootChoices.push(newMaze.root + 8);
    }

    let newRoot = rootChoices[Math.floor(Math.random() * rootChoices.length)];
    newMaze.tree[Math.floor(newMaze.root / 8)][newMaze.root % 8] = newRoot;
    newMaze.root = newRoot;
    newMaze.tree[Math.floor(newMaze.root / 8)][newMaze.root % 8] = null;
  }

  return newMaze;
}

export function getMazeBorders(maze) {
  let tree = maze.tree;
  let borders = {};
  for (let i = 0; i < 64; i++) {
    borders[i] = new Set(["top", "bottom", "left", "right"]);
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (tree[i][j]) {
        if (i * 8 + j - tree[i][j] === 8) {
          borders[i * 8 + j].delete("top");
          borders[tree[i][j]].delete("bottom");
        } else if (i * 8 + j - tree[i][j] === -8) {
          borders[i * 8 + j].delete("bottom");
          borders[tree[i][j]].delete("top");
        } else if (i * 8 + j - tree[i][j] === 1) {
          borders[i * 8 + j].delete("left");
          borders[tree[i][j]].delete("right");
        } else if (i * 8 + j - tree[i][j] === -1) {
          borders[i * 8 + j].delete("right");
          borders[tree[i][j]].delete("left");
        } else {
          console.error("Invalid maze tree");
        }
      }
    }
  }

  return borders;
}

export function validMoveInMaze(maze, move) {
  let piece = move.piece;
  let source = move.from;
  let target = move.to;

  if (piece === "n") {
    return true;
  }

  let tree = maze.tree;
  let sourceIndex = SQUARES.indexOf(source);
  let targetIndex = SQUARES.indexOf(target);

  if (piece === "k" || piece === "q" || piece === "p") {
    //Detect if straight or diagonal movement
    let rankMovement = source[0] !== target[0];
    let fileMovement = source[1] !== target[1];

    if (rankMovement && fileMovement) {
      piece = "b";
    } else {
      piece = "r";
    }
  }

  //Straight Movement
  if (piece === "r") {
    let rankMovement = source[0] === target[0];
    let step = rankMovement ? 8 : 1;
    step = sourceIndex < targetIndex ? step : -step;

    let current = sourceIndex;
    let next;

    while (current !== targetIndex) {
      next = current + step;
      if (
        tree[Math.floor(current / 8)][current % 8] !== next &&
        tree[Math.floor(next / 8)][next % 8] !== current
      ) {
        return false;
      }
      current = next;
    }
    return true;
  } else if (piece === "b") {
    // Diagonal Movement
    let goingDown = sourceIndex < targetIndex;
    let goingRight = sourceIndex % 8 < targetIndex % 8;

    let step = goingDown ? 9 : -7;
    step = goingRight ? step : step - 2;

    let midStep1 = goingDown ? 8 : -8;
    let midStep2 = goingRight ? 1 : -1;

    let current = sourceIndex;
    let next;

    while (current !== targetIndex) {
      next = current + step;
      let option1 = current + midStep1;
      let option2 = current + midStep2;

      if (
        ((tree[Math.floor(current / 8)][current % 8] !== option1 &&
          tree[Math.floor(option1 / 8)][option1 % 8] !== current) ||
          (tree[Math.floor(option1 / 8)][option1 % 8] !== next &&
            tree[Math.floor(next / 8)][next % 8] !== option1)) &&
        ((tree[Math.floor(current / 8)][current % 8] !== option2 &&
          tree[Math.floor(option2 / 8)][option2 % 8] !== current) ||
          (tree[Math.floor(option2 / 8)][option2 % 8] !== next &&
            tree[Math.floor(next / 8)][next % 8] !== option2))
      ) {
        return false;
      }
      current = next;
    }
    return true;
  }
  console.error("Invalid piece type");
  return true;
}
