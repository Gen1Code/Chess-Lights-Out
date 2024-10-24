import { SQUARES, pawnSquareInFront, kingSurroundingSquares } from "@utils/ChessUtils";
import { Chess } from "chess.js";
import { attackingKingInMaze, possibleMoves, attackingKing} from "@utils/OriginShiftMaze";

export function styleForLightsOut(styles, litupSquares) {
    let squares = new Set(SQUARES);

    //Remove the squares that are lit up
    litupSquares.forEach((square) => {
        squares.delete(square);
    });

    squares.forEach((square) => {
        //Make child element invisible and background dark
        styles[square].contentVisibility = "hidden";
        styles[square].backgroundColor = "rgb(20, 20, 20)";
    });

    return styles;
}

export function getLitupSquares(game, maze, orientation) {
    //Make it your turn (done for moves function to work properly)
    if (game.turn() !== orientation[0]) {
        let splitFen = game.fen().split(" ");
        splitFen[1] = splitFen[1] === "w" ? "b" : "w";
        game = new Chess(splitFen.join(" "));
    }

    let moves;
    if (maze !== null) {
        moves = possibleMoves(game, maze, false);
    } else {
        moves = game.moves({ verbose: true });
    }
    
    let squares = new Set();
    moves.forEach((move) => {
        squares.add(move.to);
    });

    const board = game.board();

    board.forEach((row, i) => {
        row.forEach((piece, j) => {
            if (piece && piece.color === orientation[0]) {
                let square = SQUARES[8 * i + j];
                //If it's your own piece, light it up
                squares.add(square);
                if (piece.type === "k") {
                    //if it's your king, light up all the squares around it even non possible moves
                    let surroundingSquares = kingSurroundingSquares(square);
                    squares = squares.union(surroundingSquares);
                } else if (piece.type === "p") {
                    // if it's your pawn, light up the square in front of it
                    let squaresInFront = pawnSquareInFront(square, piece.color);
                    squares = squares.union(squaresInFront);
                }
            }
        });
    });

    //If you are in check light up the checking pieces
    if(game.inCheck()){
        let attackers = maze === null ? attackingKing(game) : attackingKingInMaze(game, maze);
        attackers.forEach((attacker) => {
            squares.add(attacker);
        });
    }

    return squares;
}