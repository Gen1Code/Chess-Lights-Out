export class OriginShiftMaze {
  constructor() {
    this.root = 63;
    this.tree = [
      [1, 2, 3, 4, 5, 6, 7, 15],
      [9, 10, 11, 12, 13, 14, 15, 23],
      [17, 18, 19, 20, 21, 22, 23, 31],
      [25, 26, 27, 28, 29, 30, 31, 39],
      [33, 34, 35, 36, 37, 38, 39, 47],
      [41, 42, 43, 44, 45, 46, 47, 55],
      [49, 50, 51, 52, 53, 54, 55, 63],
      [57, 58, 59, 60, 61, 62, 63, null],
    ];
    this.scramble();
  }

  shift() {
    let rootChoices = [];
    if (this.root % 8 != 0) {
      rootChoices.push(this.root - 1);
    }
    if (this.root % 8 != 7) {
      rootChoices.push(this.root + 1);
    }
    if (this.root >= 8) {
      rootChoices.push(this.root - 8);
    }
    if (this.root <= 55) {
      rootChoices.push(this.root + 8);
    }

    let newRoot = rootChoices[Math.floor(Math.random() * rootChoices.length)];
    this.tree[Math.floor(this.root / 8)][this.root % 8] = newRoot;
    this.root = newRoot;
    this.tree[Math.floor(this.root / 8)][this.root % 8] = null;
  }

  scramble(n = 400) {
    for (let i = 0; i < n; i++) {
      this.shift();
    }
  }

  getMazeBorders() {
    let tree = this.tree;
    let borders = {};
    for (let i = 0; i < 64; i++) {
      borders[i] = new Set(["top", "bottom", "left", "right"]);
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (tree[i][j]) {
          if ((i * 8 + j) - tree[i][j] === 8) {
            borders[i * 8 + j].delete("top");
            borders[tree[i][j]].delete("bottom");
          } else if ((i * 8 + j) - tree[i][j] === -8) {
            borders[i * 8 + j].delete("bottom");
            borders[tree[i][j]].delete("top");
          } else if ((i * 8 + j) - tree[i][j] === 1) {
            borders[i * 8 + j].delete("left");
            borders[tree[i][j]].delete("right");
          } else if ((i * 8 + j) - tree[i][j] === -1) {
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
}
