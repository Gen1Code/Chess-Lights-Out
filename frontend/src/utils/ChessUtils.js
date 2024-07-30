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
  // console.log("findKing triggered with color:", color);
  // console.log("board", board);
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
