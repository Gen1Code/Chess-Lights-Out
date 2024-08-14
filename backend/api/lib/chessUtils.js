import { Chess } from "chess.js";

// prettier-ignore
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
function inCheckInMaze(game, maze) {
    if (!game.inCheck()) {
        return false;
    }

    let turn = game.turn();
    let kingSquare = findKing(game, turn);

    let fen = game.fen().split(" ");
    fen[1] = turn === "w" ? "b" : "w";
    let oppTurnGame = new Chess(fen.join(" "));

    let moves = piecesMovements(oppTurnGame, maze);
    for (let i = 0; i < moves.length; i++) {
        if (moves[i].to === kingSquare) {
            return true;
        }
    }
    return false;
}

function findKing(game, color) {
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

function canDiagonal(tree, sRow, sCol, tRow, tCol) {
    let sIndex = sRow * 8 + sCol;
    let tIndex = tRow * 8 + tCol;

    let midStep1 = sRow < tRow ? 1 : -1; //down or up
    let midStep2 = sCol < tCol ? 1 : -1; //right or left

    let option1Index = sIndex + 8 * midStep1;
    let option2Index = sIndex + midStep2;

    let option1Row = sRow + midStep1;
    let option2Col = sCol + midStep2;

    return !(
        ((tree[sRow][sCol] !== option1Index &&
            tree[option1Row][sCol] !== sIndex) ||
            (tree[option1Row][sCol] !== tIndex &&
                tree[tRow][tCol] !== option1Index)) &&
        ((tree[sRow][sCol] !== option2Index &&
            tree[sRow][option2Col] !== sIndex) ||
            (tree[sRow][option2Col] !== tIndex &&
                tree[tRow][tCol] !== option2Index))
    );
}

function canStraight(tree, sRow, sCol, tRow, tCol) {
    let sIndex = sRow * 8 + sCol;
    let tIndex = tRow * 8 + tCol;
    return tree[sRow][sCol] === tIndex || tree[tRow][tCol] === sIndex;
}

function piecesMovements(game, maze) {
    let turn = game.turn();
    let board = game.board();
    let tree = maze.tree;
    let pawnDirection = turn === "w" ? -1 : 1;

    let moves = []; // {from: "a1", to: "a2", piece: "p", color: "w", flags: "n"}
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (board[row][col] && board[row][col].color === turn) {
                switch (board[row][col].type) {
                    case "p":
                        //Forward
                        if (
                            board[row + pawnDirection][col] === null &&
                            canStraight(
                                tree,
                                row,
                                col,
                                row + pawnDirection,
                                col
                            )
                        ) {
                            moves.push({
                                from: SQUARES[row * 8 + col],
                                to: SQUARES[(row + pawnDirection) * 8 + col],
                                piece: "p",
                                color: turn,
                                flags:
                                    row === (turn === "w" ? 1 : 6) ? "np" : "n",
                            });

                            if (
                                row === (turn === "w" ? 6 : 1) &&
                                board[row + 2 * pawnDirection][col] === null &&
                                canStraight(
                                    tree,
                                    row + pawnDirection,
                                    col,
                                    row + 2 * pawnDirection,
                                    col
                                )
                            ) {
                                moves.push({
                                    from: SQUARES[row * 8 + col],
                                    to: SQUARES[
                                        (row + 2 * pawnDirection) * 8 + col
                                    ],
                                    piece: "p",
                                    color: turn,
                                    flags: "nb",
                                });
                            }
                        }
                        //Capture
                        if (
                            col > 0 &&
                            board[row + pawnDirection][col - 1] &&
                            board[row + pawnDirection][col - 1].color !==
                                turn &&
                            canDiagonal(
                                tree,
                                row,
                                col,
                                row + pawnDirection,
                                col - 1
                            )
                        ) {
                            moves.push({
                                from: SQUARES[row * 8 + col],
                                to: SQUARES[
                                    (row + pawnDirection) * 8 + col - 1
                                ],
                                piece: "p",
                                color: turn,
                                flags:
                                    row === (turn === "w" ? 1 : 6) ? "cp" : "c",
                            });
                        }
                        if (
                            col < 7 &&
                            board[row + pawnDirection][col + 1] &&
                            board[row + pawnDirection][col + 1].color !==
                                turn &&
                            canDiagonal(
                                tree,
                                row,
                                col,
                                row + pawnDirection,
                                col + 1
                            )
                        ) {
                            moves.push({
                                from: SQUARES[row * 8 + col],
                                to: SQUARES[
                                    (row + pawnDirection) * 8 + col + 1
                                ],
                                piece: "p",
                                color: turn,
                                flags:
                                    row === (turn === "w" ? 1 : 6) ? "cp" : "c",
                            });
                        }

                        //En passant
                        let possibleEnPassant = game.fen().split(" ")[3];
                        if (possibleEnPassant !== "-") {
                            let index = SQUARES.indexOf(possibleEnPassant);
                            let enPassantRow = Math.floor(index / 8);
                            let enPassantCol = index % 8;
                            if (
                                enPassantRow === row + pawnDirection &&
                                (enPassantCol === col - 1 ||
                                    enPassantCol === col + 1) &&
                                canDiagonal(
                                    tree,
                                    row,
                                    col,
                                    enPassantRow,
                                    enPassantCol
                                )
                            ) {
                                moves.push({
                                    from: SQUARES[row * 8 + col],
                                    to: SQUARES[
                                        enPassantRow * 8 + enPassantCol
                                    ],
                                    piece: "p",
                                    color: turn,
                                    flags: "e",
                                });
                            }
                        }

                        break;
                    case "r":
                        const axisDirections = [
                            [-1, 0],
                            [1, 0],
                            [0, -1],
                            [0, 1],
                        ];
                        for (let d = 0; d < 4; d++) {
                            let currentRow = row;
                            let currentCol = col;

                            for (let i = 1; i < 8; i++) {
                                const nextRow = row + axisDirections[d][0] * i;
                                const nextCol = col + axisDirections[d][1] * i;
                                if (
                                    nextRow >= 0 &&
                                    nextRow < 8 &&
                                    nextCol >= 0 &&
                                    nextCol < 8 &&
                                    canStraight(
                                        tree,
                                        currentRow,
                                        currentCol,
                                        nextRow,
                                        nextCol
                                    ) &&
                                    (board[nextRow][nextCol] === null ||
                                        board[nextRow][nextCol].color !== turn)
                                ) {
                                    let capture =
                                        board[nextRow][nextCol] !== null;
                                    moves.push({
                                        from: SQUARES[row * 8 + col],
                                        to: SQUARES[nextRow * 8 + nextCol],
                                        piece: "r",
                                        color: turn,
                                        flags: capture ? "c" : "n",
                                    });

                                    if (capture) {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                                currentRow = nextRow;
                                currentCol = nextCol;
                            }
                        }
                        break;
                    case "n":
                        const knightMoves = [
                            [-2, -1],
                            [-2, 1],
                            [-1, -2],
                            [-1, 2],
                            [1, -2],
                            [1, 2],
                            [2, -1],
                            [2, 1],
                        ];
                        for (let i = 0; i < knightMoves.length; i++) {
                            let nextRow = row + knightMoves[i][0];
                            let nextCol = col + knightMoves[i][1];
                            if (
                                nextRow >= 0 &&
                                nextRow < 8 &&
                                nextCol >= 0 &&
                                nextCol < 8 &&
                                (board[nextRow][nextCol] === null ||
                                    board[nextRow][nextCol].color !== turn)
                            ) {
                                moves.push({
                                    from: SQUARES[row * 8 + col],
                                    to: SQUARES[nextRow * 8 + nextCol],
                                    piece: "n",
                                    color: turn,
                                    flags:
                                        board[nextRow][nextCol] === null
                                            ? "n"
                                            : "c",
                                });
                            }
                        }
                        break;
                    case "b":
                        const bishopDirections = [
                            [-1, -1],
                            [-1, 1],
                            [1, -1],
                            [1, 1],
                        ];
                        for (let d = 0; d < 4; d++) {
                            let currentRow = row;
                            let currentCol = col;

                            for (let i = 1; i < 8; i++) {
                                const nextRow =
                                    row + bishopDirections[d][0] * i;
                                const nextCol =
                                    col + bishopDirections[d][1] * i;
                                if (
                                    nextRow >= 0 &&
                                    nextRow < 8 &&
                                    nextCol >= 0 &&
                                    nextCol < 8 &&
                                    canDiagonal(
                                        tree,
                                        currentRow,
                                        currentCol,
                                        nextRow,
                                        nextCol
                                    ) &&
                                    (board[nextRow][nextCol] === null ||
                                        board[nextRow][nextCol].color !== turn)
                                ) {
                                    let capture =
                                        board[nextRow][nextCol] !== null;

                                    moves.push({
                                        from: SQUARES[row * 8 + col],
                                        to: SQUARES[nextRow * 8 + nextCol],
                                        piece: "b",
                                        color: turn,
                                        flags: capture ? "c" : "n",
                                    });

                                    if (capture) {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                                currentRow = nextRow;
                                currentCol = nextCol;
                            }
                        }
                        break;
                    case "q":
                        const queenDirections = [
                            [-1, -1],
                            [-1, 1],
                            [1, -1],
                            [1, 1],
                            [-1, 0],
                            [1, 0],
                            [0, -1],
                            [0, 1],
                        ];
                        for (let d = 0; d < 8; d++) {
                            let currentRow = row;
                            let currentCol = col;

                            for (let i = 1; i < 8; i++) {
                                const nextRow = row + queenDirections[d][0] * i;
                                const nextCol = col + queenDirections[d][1] * i;
                                if (
                                    nextRow >= 0 &&
                                    nextRow < 8 &&
                                    nextCol >= 0 &&
                                    nextCol < 8 &&
                                    (board[nextRow][nextCol] === null ||
                                        board[nextRow][nextCol].color !==
                                            turn) &&
                                    ((d < 4 &&
                                        canDiagonal(
                                            tree,
                                            currentRow,
                                            currentCol,
                                            nextRow,
                                            nextCol
                                        )) ||
                                        (d >= 4 &&
                                            canStraight(
                                                tree,
                                                currentRow,
                                                currentCol,
                                                nextRow,
                                                nextCol
                                            )))
                                ) {
                                    let capture =
                                        board[nextRow][nextCol] !== null;

                                    moves.push({
                                        from: SQUARES[row * 8 + col],
                                        to: SQUARES[nextRow * 8 + nextCol],
                                        piece: "q",
                                        color: turn,
                                        flags: capture ? "c" : "n",
                                    });

                                    if (capture) {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                                currentRow = nextRow;
                                currentCol = nextCol;
                            }
                        }
                        break;
                    case "k":
                        const kingDirections = [
                            [-1, -1],
                            [-1, 1],
                            [1, -1],
                            [1, 1],
                            [-1, 0],
                            [1, 0],
                            [0, -1],
                            [0, 1],
                        ];
                        for (let d = 0; d < 8; d++) {
                            let nextRow = row + kingDirections[d][0];
                            let nextCol = col + kingDirections[d][1];
                            if (
                                nextRow >= 0 &&
                                nextRow < 8 &&
                                nextCol >= 0 &&
                                nextCol < 8 &&
                                (board[nextRow][nextCol] === null ||
                                    board[nextRow][nextCol].color !== turn) &&
                                ((d < 4 &&
                                    canDiagonal(
                                        tree,
                                        row,
                                        col,
                                        nextRow,
                                        nextCol
                                    )) ||
                                    (d >= 4 &&
                                        canStraight(
                                            tree,
                                            row,
                                            col,
                                            nextRow,
                                            nextCol
                                        )))
                            ) {
                                moves.push({
                                    from: SQUARES[row * 8 + col],
                                    to: SQUARES[nextRow * 8 + nextCol],
                                    piece: "k",
                                    color: turn,
                                    flags:
                                        board[nextRow][nextCol] === null
                                            ? "n"
                                            : "c",
                                });
                            }
                        }

                        //Castling
                        let castleRights = game.getCastlingRights(turn);
                        let rank = turn === "w" ? 7 : 0;
                        if (col == 4 && row === rank) {
                            if (
                                castleRights["k"] &&
                                board[rank][7] &&
                                board[rank][7].type === "r" &&
                                board[rank][7].color === turn &&
                                board[rank][5] === null &&
                                board[rank][6] === null &&
                                canStraight(tree, rank, 4, rank, 7)
                            ) {
                                moves.push({
                                    from: SQUARES[rank * 8 + 4],
                                    to: SQUARES[rank * 8 + 6],
                                    piece: "k",
                                    color: turn,
                                    flags: "nk",
                                });
                            }
                            if (
                                castleRights["q"] &&
                                board[rank][0] &&
                                board[rank][0].type === "r" &&
                                board[rank][0].color === turn &&
                                board[rank][1] === null &&
                                board[rank][2] === null &&
                                board[rank][3] === null &&
                                canStraight(tree, rank, 4, rank, 0)
                            ) {
                                moves.push({
                                    from: SQUARES[rank * 8 + 4],
                                    to: SQUARES[rank * 8 + 2],
                                    piece: "k",
                                    color: turn,
                                    flags: "nq",
                                });
                            }
                        }

                        break;
                }
            }
        }
    }
    return moves;
}

export function possibleMoves(game, maze) {
    //No Moves if game is over
    let fen = game.fen().split(" ");
    fen[1] = game.turn() === "w" ? "b" : "w";
    let oppTurnGame = new Chess(fen.join(" "));
    if (inCheckInMaze(oppTurnGame, maze)) {
        return [];
    }

    let moves = piecesMovements(game, maze);
    // console.log("All Possible Moves in Maze (non-filtered)", moves);

    let filteredMoves = [];
    // FIlter for actual moves that dont cause a check if done
    let gameCopy = new Chess(game.fen());
    let turn = gameCopy.turn();
    for (let i = 0; i < moves.length; i++) {
        let captured = gameCopy.get(moves[i].to);

        //do the move
        gameCopy.remove(moves[i].from);
        if (moves[i].flags.includes("p")) {
            gameCopy.put({ type: "q", color: turn }, moves[i].to);
        } else {
            gameCopy.put({ type: moves[i].piece, color: turn }, moves[i].to);
        }
        //check if in check
        // console.log("Checking for check in maze", moves[i]);
        if (inCheckInMaze(gameCopy, maze)) {
            // console.log("Filtered out move", moves[i]);
        } else {
            filteredMoves.push(moves[i]);
        }

        //undo the move
        gameCopy.remove(moves[i].to);
        if (captured) {
            gameCopy.put(captured, moves[i].to);
        }
        gameCopy.put({ type: moves[i].piece, color: turn }, moves[i].from);
    }
    // console.log("All Possible Moves in Maze (filtered)", filteredMoves);

    return filteredMoves;
}

export function makeMoveInMaze(move, game) {
    let fen = game.fen().split(" ");
    let turn = game.turn();
    console.log("Old FEN", fen);

    // Turn Change
    fen[1] = turn === "w" ? "b" : "w";

    //Castling
    if (move.flags.includes("k")) {
        if (move.to === "g1") {
            fen[2] = fen[2].replace("K", "");
        } else if (move.to === "c1") {
            fen[2] = fen[2].replace("Q", "");
        }
    } else if (move.flags.includes("q")) {
        if (move.to === "g8") {
            fen[2] = fen[2].replace("k", "");
        } else if (move.to === "c8") {
            fen[2] = fen[2].replace("q", "");
        }
    } else if (move.piece === "k") {
        if (move.to[1] <= 7) {
            fen[2] = fen[2].replace("kq", "");
        } else {
            fen[2] = fen[2].replace("KQ", "");
        }
    }

    // En passant
    let enPassantSquare = fen[3];
    if (move.flags.includes("b")) {
        fen[3] =
            move.from[0] +
            (parseInt(move.from[1]) + (move.color === "w" ? 1 : -1));
    } else {
        fen[3] = "-";
    }

    //Half Move Clock
    if (move.piece === "p" || !move.flags.includes("n")) {
        fen[4] = 0;
    } else {
        fen[4] = parseInt(fen[4]) + 1;
    }

    //Full Move
    if (turn === "b") {
        fen[5] = parseInt(fen[5]) + 1;
    }

    console.log("Move", move);
    console.log("New FEN w/o move", fen);

    game.load(fen.join(" "));

    game.remove(move.from);
    if (move.flags.includes("p")) {
        game.put({ type: move.promotion, color: move.color }, move.to);
    } else {
        game.put({ type: move.piece, color: move.color }, move.to);
    }

    //Remove pawn if en passant
    if (move.flags.includes("e")) {
        game.remove(enPassantSquare);
    } else if (move.flags.includes("k")) {
        //King-side Castling
        if (move.to === "g1") {
            game.remove("h1");
            game.put({ type: "r", color: move.color }, "f1");
        } else if (move.to === "g8") {
            game.remove("h8");
            game.put({ type: "r", color: move.color }, "f8");
        }
    } else if (move.flags.includes("q")) {
        //Queen-side Castling
        if (move.to === "c1") {
            game.remove("a1");
            game.put({ type: "r", color: move.color }, "d1");
        } else if (move.to === "c8") {
            game.remove("a8");
            game.put({ type: "r", color: move.color }, "d8");
        }
    }

    console.log("New FEN w/ move", game.fen());
}

export function getRandomMaze() {
    return scramble(defaultMaze, 1000);
}

export function scramble(maze, n) {
    // console.log("scramble", maze, n)
    let newMaze = { ...maze };
    for (let i = 0; i < n; i++) {
        let root = newMaze.root;
        let rootChoices = [];
        if (root % 8 != 0) {
            rootChoices.push(root - 1);
        }
        if (root % 8 != 7) {
            rootChoices.push(root + 1);
        }
        if (root >= 8) {
            rootChoices.push(root - 8);
        }
        if (root <= 55) {
            rootChoices.push(root + 8);
        }

        let newRoot =
            rootChoices[Math.floor(Math.random() * rootChoices.length)];
        newMaze.tree[Math.floor(root / 8)][root % 8] = newRoot;
        newMaze.root = newRoot;
        newMaze.tree[Math.floor(newRoot / 8)][newRoot % 8] = null;
    }

    return newMaze;
}

export function gameOverInMaze(game, maze, moves, mazeSetting) {
    let fen = game.fen().split(" ");
    fen[1] = game.turn() === "w" ? "b" : "w";
    let oppTurnGame = new Chess(fen.join(" "));

    if (inCheckInMaze(oppTurnGame, maze)) {
        return fen[1] + "is in Checkmate";
    }

    let possMoves = possibleMoves(game, maze);
    if (possMoves.length === 0) {
        if (inCheckInMaze(game, maze)) {
            return game.turn() + "is in Checkmate";
        }
        return "Stalemate";
    }

    //If only 2 kings are left
    let otherPieces = fen[0].replace("/[d/k]/gi", "");
    if (otherPieces === "") {
        return "Insufficient Material";
    }

    if (mazeSetting !== "Shift") {
        //threefold repetition
        let lastIdx = moves.length - 1;
        if (
            moves[lastIdx] === moves[lastIdx - 2] &&
            moves[lastIdx - 1] === moves[lastIdx - 3] &&
            moves[lastIdx] === moves[lastIdx - 4] &&
            moves[lastIdx - 1] === moves[lastIdx - 5]
        ) {
            return "Threefold Repetition";
        }

        //50 move rule
        if (fen[4] >= 100) {
            return "Fifty Move Rule";
        }
    }

    return "";
}
