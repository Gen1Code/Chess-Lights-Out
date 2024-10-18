export const SQUARES = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
];

export const ROWCOLTOSQUARE = [
  ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'],
  ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'],
  ['a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'],
  ['a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5'],
  ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4'],
  ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3'],
  ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'],
  ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'],
];

const PIECES = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king",
  P: "pawn",
  R: "rook",
  N: "knight",
  B: "bishop",
  Q: "queen",
  K: "king",
};

export function pawnSquareInFront(pawnSquare, color) {
  let squares = new Set();
  //if it's your pawn, light up the squares in front of it
  let [file, rank] = pawnSquare.split("");
  let rankIndex = "12345678".indexOf(rank);
  let direction = color === "w" ? 1 : -1;
  let newRankIndex = rankIndex + direction;
  if (newRankIndex >= 0 && newRankIndex <= 7) {
    squares.add(file + "12345678"[newRankIndex]);
  }
  return squares;
}

export function kingSurroundingSquares(kingSquare) {
  let squares = new Set();
  let [file, rank] = kingSquare.split("");
  let fileIndex = "abcdefgh".indexOf(file);
  let rankIndex = "12345678".indexOf(rank);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let newFileIndex = fileIndex + i;
      let newRankIndex = rankIndex + j;
      if (
        newFileIndex >= 0 &&
        newFileIndex <= 7 &&
        newRankIndex >= 0 &&
        newRankIndex <= 7
      ) {
        squares.add("abcdefgh"[newFileIndex] + "12345678"[newRankIndex]);
      }
    }
  }
  return squares;
}

export function findKing(game, color) {
  let kingSquare = null;
  const board = game.board();
  board.forEach((row, i) => {
    row.forEach((piece, j) => {
      if (piece && piece.type === "k" && piece.color === color) {
        kingSquare = SQUARES[8 * i + j];
      }
    });
  });
  return kingSquare;
}

export function gameOverMessage(game) {
  if (game.isCheckmate()) {
    return "Checkmate!";
  } else if (game.isInsufficientMaterial()) {
    return "Insufficient Material!";
  } else if (game.isStalemate()) {
    return "Stalemate!";
  } else if (game.isThreefoldRepetition()) {
    return "Threefold Repetition!";
  } else if (game.isDraw()) {
    return "50 Move Rule!";
  } else {
    console.error("Game over but no reason found");
    return "Game Over!";
  }
}

function indextoRowCol(index) {
  return [Math.floor(index / 8), index % 8];
}

function pieceColor(piece) {
  return piece ? piece.color : "n";
}

function oppositeColor(color1, color2) {
  if (color1 === "n" || color2 === "n") {
      return false;
  }
  return color1 !== color2;
}

export function getLocationalMoves(board, row, col) {
  let piece = board[row][col].type;
  let color = board[row][col].color;
  let moves = [];

  switch (PIECES[piece]) {
      case "pawn":
          moves = getPawnMoves(board, row, col, color);
          break;
      case "rook":
          moves = getRookMoves(board, row, col, color);
          break;
      case "knight":
          moves = getKnightMoves(board, row, col, color);
          break;
      case "bishop":
          moves = getBishopMoves(board, row, col, color);
          break;
      case "queen":
          moves = getRookMoves(board, row, col, color).concat(
              getBishopMoves(board, row, col, color)
          );
          break;
      case "king":
          moves = getKingMoves(board, row, col, color);
          break;
  }

  return moves;
}

function getPawnMoves(board, row, col, color) {
  let moves = [];
  let stepRow = color === "w" ? 1 : -1;

  // Moving forward
  if (board[row + stepRow][col] === null) {
      // Move one square forward
      moves.push(ROWCOLTOSQUARE[row + stepRow][col]);

      // Moving two squares forward
      if (
          (color === "w" && row === 1) ||
          (color === "b" && row === 6)
      ) {
          if (board[row + 2*stepRow][col] === null) {
              moves.push(ROWCOLTOSQUARE[row + 2*stepRow][col]);
          }
      }
  }

  // Capture diagonally
  if (
      col > 0 &&
      oppositeColor(pieceColor(board[row + stepRow][col - 1]), color)
  ) {
      moves.push(ROWCOLTOSQUARE[row + stepRow][col - 1]);
  }
  if (
      col < 7 &&
      oppositeColor(pieceColor(board[row + stepRow][col + 1]), color)
  ) {
      moves.push(ROWCOLTOSQUARE[row + stepRow][col + 1]);
  }

  //En passant
  // if (this.history.length > 0) {
  //     let lastMove = this.history[this.history.length - 1];
  //     if (
  //         lastMove.piece === "pawn" &&
  //         Math.abs(lastMove.from[1] - lastMove.to[1]) == 2
  //     ) {
  //         if (fileToColNum(lastMove.to[0]) === col - 1) {
  //             moves.push(index + direction - 1);
  //         } else if (fileToColNum(lastMove.to[0]) === col + 1) {
  //             moves.push(index + direction + 1);
  //         }
  //     }
  // }

  return moves;
}

function getRookMoves(board, row, col, color) {
  let moves = [];

  const axisDirections = [[1,0], [-1,0], [0,1], [0,-1]];
  const limits = [
      (i) => row + i < 8,
      (i) => row - i >= 0,
      (i) => col + i < 8,
      (i) => col - i >= 0,
  ];

  for (let d = 0; d < 4; d++) {
      for (let i = 1; i < 8; i++) {
          const newRow = row + axisDirections[d][0] * i;
          const newCol = col + axisDirections[d][1] * i;
          if (limits[d](i) && pieceColor(board[newRow][newCol]) != color) {
              moves.push(ROWCOLTOSQUARE[newRow][newCol]);
              if (board[newRow][newCol] != null) {
                  break;
              }
          } else {
              break;
          }
      }
  }

  return moves;
}

function getBishopMoves(board, row, col, color) {
  let moves = [];

  const axisDirections = [[-1,-1], [-1,1], [1,-1], [1,1]];
  const limits = [
      (i) => row - i >= 0 && col - i >= 0,
      (i) => row - i >= 0 && col + i < 8,
      (i) => row + i < 8 && col - i >= 0,
      (i) => row + i < 8 && col + i < 8,
  ];

  for (let d = 0; d < 4; d++) {
      for (let i = 1; i < 8; i++) {
          const newRow = row + axisDirections[d][0] * i;
          const newCol = col + axisDirections[d][1] * i;
          if (limits[d](i) && pieceColor(board[newRow][newCol]) != color) {
              moves.push(ROWCOLTOSQUARE[newRow][newCol]);
              if (board[newRow][newCol] != null) {
                  break;
              }
          } else {
              break;
          }
      }
  }

  return moves;
}

function getKingMoves(board, row, col, color) {
  let moves = [];

  const axisDirections = [
      [-1,-1], [-1,0], [-1,1],
      [0,-1], [0,1],
      [1,-1], [1,0], [1,1],
  ]
  const limits = [
      (i) => row - i >= 0 && col - i >= 0,
      (i) => row - i >= 0,
      (i) => row - i >= 0 && col + i < 8,
      (i) => col - i >= 0,
      (i) => col + i < 8,
      (i) => row + i < 8 && col - i >= 0,
      (i) => row + i < 8,
      (i) => row + i < 8 && col + i < 8,
  ];

  for (let d = 0; d < 8; d++) {
      const newRow = row + axisDirections[d][0];
      const newCol = col + axisDirections[d][1];

      if (limits[d](1) && pieceColor(board[newRow][newCol]) != color) {
          moves.push(ROWCOLTOSQUARE[newRow][newCol]);
      }
  }

  return moves;
}

function getKnightMoves(board, row, col, color) {
  let moves = [];

  const axisDirections = [
      [-2,-1], [-2,1], [-1,-2], [-1,2],
      [1,-2], [1,2], [2,-1], [2,1],
  ];
  const limits = [
      row - 2 >= 0 && col - 1 >= 0,
      row - 2 >= 0 && col + 1 < 8,
      row - 1 >= 0 && col - 2 >= 0,
      row - 1 >= 0 && col + 2 < 8,
      row + 1 < 8 && col - 2 >= 0,
      row + 1 < 8 && col + 2 < 8,
      row + 2 < 8 && col - 1 >= 0,
      row + 2 < 8 && col + 1 < 8,
  ];

  for (let d = 0; d < 8; d++) {
      const newRow = row + axisDirections[d][0];
      const newCol = col + axisDirections[d][1];

      if (limits[d] && pieceColor(board[newRow][newCol]) != color) {
          moves.push(ROWCOLTOSQUARE[newRow][newCol]);
      }
  }

  return moves;
}