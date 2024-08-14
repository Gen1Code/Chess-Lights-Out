import { findKing, SQUARES } from "./ChessUtils";
import { Chess } from "chess.js";

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

export function getMazeBorders(maze) {
    let tree = maze.tree;
    let borders = {};
    for (let i = 0; i < 64; i++) {
        borders[i] = new Set(["top", "bottom", "left", "right"]);
    }

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (tree[i][j] !== null) {
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

    let moves = []; // {from: "a1", to: "a2", piece: "p", color: "w"}
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
                        break;
                }
            }
        }
    }
    return moves;
}

//Optimised for speed
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

export function inCheckInMaze(game, maze) {
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

export function attackingKingInMaze(game, maze) {
    let attackers = [];

    if (!game.inCheck()) {
        return attackers;
    }

    let turn = game.turn();
    let kingSquare = findKing(game, turn);

    let fen = game.fen().split(" ");
    fen[1] = turn === "w" ? "b" : "w";
    let oppTurnGame = new Chess(fen.join(" "));

    let moves = piecesMovements(oppTurnGame, maze);
    for (let i = 0; i < moves.length; i++) {
        if (moves[i].to === kingSquare) {
            attackers.push(moves[i].from);
        }
    }
    return attackers;
}

export function makeMoveInMaze(game, move) {
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

export function styleForMaze(styles, borders, orientation) {
    //flip the maze for black player
    if (orientation === "black") {
        let newBorders = {};
        Object.keys(borders).forEach((squareIndex) => {
            newBorders[squareIndex] = new Set();
            if (borders[squareIndex].has("top")) {
                newBorders[squareIndex].add("bottom");
            }
            if (borders[squareIndex].has("bottom")) {
                newBorders[squareIndex].add("top");
            }
            if (borders[squareIndex].has("left")) {
                newBorders[squareIndex].add("right");
            }
            if (borders[squareIndex].has("right")) {
                newBorders[squareIndex].add("left");
            }
        });
        borders = newBorders;
    }

    Object.keys(borders).forEach((squareIndex) => {
        let square = SQUARES[squareIndex];
        styles[square].boxSizing = "border-box";

        if (borders[squareIndex].has("top")) {
            styles[square].borderTop = "3px solid firebrick";
        }
        if (borders[squareIndex].has("bottom")) {
            styles[square].borderBottom = "3px solid firebrick";
        }
        if (borders[squareIndex].has("left")) {
            styles[square].borderLeft = "3px solid firebrick";
        }
        if (borders[squareIndex].has("right")) {
            styles[square].borderRight = "3px solid firebrick";
        }
    });
    // console.log("styles:", styles);

    return styles;
}

export function gameOverMessageInMaze(game, maze, moves, mazeSetting) {
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
    let otherPieces = fen[0].replace(/[\d\/k]/gi, "");
    console.log("Other Pieces", otherPieces);
    if (otherPieces === "") {
        return "Insufficient Material";
    }

    if (mazeSetting !== "Shift") {
        //threefold repetition
        let lastIdx = moves.length - 1;
        if (
            lastIdx > 5 &&
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

export function isGameOverInMaze(game, maze, moves, mazeSetting) {
    let gameOverReason = gameOverMessageInMaze(game, maze, moves, mazeSetting);
    if (gameOverReason !== "") {
        return true;
    }
    return false;
}
