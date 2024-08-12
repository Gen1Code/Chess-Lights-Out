import { useEffect, useState, useContext } from "react";
import { GameContext } from "@context/GameContext";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GameOverCard } from "@components/GameOverCard";
import { getBotMove } from "@utils/BasicChessBot";
import {
    getRandomMaze,
    scramble,
    getMazeBorders,
    possibleMoves,
    inCheckInMaze,
    styleForMaze,
    mazeGameOverMessage,
} from "@utils/OriginShiftMaze";
import { styleForLightsOut, getLitupSquares } from "@utils/LightsOutUtils";
import { gameOverMessage, findKing, SQUARES } from "@utils/ChessUtils";

import "./ChessGame.css";
import { useAbly } from "ably/react";

export function ChessGame() {
    const { currentGameSettings, setCurrentGameSettings, gameId } =
        useContext(GameContext);

    let ably = useAbly();
    if (ably === "null") {
        ably = null;
    }

    const singlePlayer = currentGameSettings.mode === "Single";
    const mazeIsOn = currentGameSettings.maze !== "Off";
    const playing = currentGameSettings.status === "Playing";
    const orientation = currentGameSettings.color;

    const [game, setGame] = useState(new Chess());
    const [maze, setMaze] = useState(() => getRandomMaze());

    const [squareStyles, setSquareStyles] = useState({});
    const [checkStyle, setCheckStyle] = useState({});

    const turn = game.turn() === "w" ? "white" : "black";
    const inCheck = mazeIsOn
        ? inCheckInMaze(game, maze) && turn === orientation
        : game.inCheck() && turn === orientation;
    const isGameOver = mazeIsOn
        ? detctGameOverMaze(game, maze)
        : game.isGameOver();

    function detctGameOverMaze(game, maze) {
        let moves = possibleMoves(game, maze);
        return moves.length === 0 || game.isInsufficientMaterial();
    }

    function makeAMove(move) {
        const gameCopy = new Chess();

        if (mazeIsOn) {
            let validMove = false;
            let moves = possibleMoves(game, maze);
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].from === move.from && moves[i].to === move.to) {
                    validMove = true;
                    break;
                }
            }
            console.log("Move:", move);
            console.log("Valid move:", validMove);
            if (!validMove) {
                return;
            }
            let fen = game.fen().split(" ");
            fen[1] = fen[1] === "w" ? "b" : "w";
            gameCopy.load(fen.join(" "));
            gameCopy.remove(move.from);
            gameCopy.put({ type: move.piece, color: move.color }, move.to);
        } else {
            gameCopy.loadPgn(game.pgn());

            try {
                gameCopy.move(move);
            } catch (e) {
                console.log("Invalid move", move);
                console.error(e);
                return;
            }
        }

        setGame(gameCopy);
    }

    function onDrop(sourceSquare, targetSquare, piece) {
        if (turn !== orientation || isGameOver || !playing) return;

        let move = {
            color: piece[0],
            from: sourceSquare,
            to: targetSquare,
            piece: piece[1].toLowerCase(),
            promotion: piece[1].toLowerCase(),
        };

        makeAMove(move);
    }

    //Dev testing functions (remove when done)
    function forcegame() {
        // let fen = "k7/6Q1/3N4/8/3b3q/8/8/5K2 ";
        let fen = "8/PPPK4/8/8/8/8/4kppp/8 ";
        if (orientation === "white") {
            fen += "w";
        } else {
            fen += "b";
        }
        fen += " - - 0 40";
        let g = new Chess();
        g.load(fen);
        setGame(g);
    }
    function shiftMaze() {
        setMaze(scramble(maze, 400));
    }

    function botMove(g = game, m = maze) {
        // console.log("botMove triggered with:", orientation, turn, mazeIsOn);
        if (playing && singlePlayer) {
            let mazeCopy = m;
            let gameCopy = new Chess();

            if (mazeIsOn) {
                gameCopy.load(g.fen());
            } else {
                mazeCopy = null;
                gameCopy.loadPgn(g.pgn());
            }
            const move = getBotMove(gameCopy, mazeCopy);
            if (!move) return;

            if (mazeIsOn) {
                let fen = g.fen().split(" ");
                fen[1] = fen[1] === "w" ? "b" : "w";
                gameCopy.load(fen.join(" "));
                gameCopy.remove(move.from);
                if (move.flags.includes("p")) {
                    gameCopy.put(
                        { type: move.promotion, color: move.color },
                        move.to
                    );
                } else {
                    gameCopy.put(
                        { type: move.piece, color: move.color },
                        move.to
                    );
                }
            } else {
                gameCopy.move(move);
            }
            setGame(gameCopy);
        }
    }

    function styleSquares(litupSquares, borders) {
        // console.log("styleSquares triggered");

        let styles = {};
        let allSquares = new Set(SQUARES);

        allSquares.forEach((square) => {
            styles[square] = {};
        });

        if (currentGameSettings.lightsOut && playing) {
            styles = styleForLightsOut(styles, litupSquares);
        }

        if (mazeIsOn) {
            styles = styleForMaze(styles, borders, orientation);
        }

        // console.log("styles", styles);
        setSquareStyles(styles);
    }

    // On Turn Change
    useEffect(() => {
        console.log("useEffect triggered with turn:", turn);

        if (playing) {
            // if maze is in shift mode, make shifts
            if (currentGameSettings.maze === "Shift") {
                setMaze(scramble(maze, 10));
            }

            // if it's the computer's turn, make a move
            if (turn !== orientation && singlePlayer && !isGameOver) {
                botMove();
            }
        }
    }, [turn, currentGameSettings]);

    // If something occurs that changes the board, style the squares
    useEffect(() => {
        let realMaze = mazeIsOn ? maze : null;
        styleSquares(
            getLitupSquares(game, realMaze, orientation),
            getMazeBorders(maze)
        );
    }, [maze, game, currentGameSettings]);

    // if king is in check, style the square
    useEffect(() => {
        let styles = {};
        if (inCheck) {
            const kingSquare = findKing(game, orientation[0]);
            styles[kingSquare] = squareStyles[kingSquare];
            styles[kingSquare].backgroundColor = "rgba(255,0,0,0.25)";
        }
        setCheckStyle(styles);
    }, [inCheck]);

    // On Game Over
    useEffect(() => {
        if (isGameOver) {
            console.log("Game over");
            if (mazeIsOn) {
                setCurrentGameSettings((prev) => ({
                    ...prev,
                    status: mazeGameOverMessage(game, maze),
                }));
            } else {
                setCurrentGameSettings((prev) => ({
                    ...prev,
                    status: gameOverMessage(game),
                }));
            }
        }
    }, [isGameOver]);

    // On Game Start
    useEffect(() => {
        if (currentGameSettings.status === "Playing") {
            console.log("Game started");
  
            const newGame = new Chess();
            const newMaze = getRandomMaze();


            setGame(newGame);
            setMaze(newMaze);

            // if it's the computer's turn first, trigger a mov
            if (orientation === "black" && singlePlayer) {
                botMove(newGame, newMaze);
            }
        }
    }, [currentGameSettings.status]);

    useEffect(() => {
        if (ably && !singlePlayer) {
            console.log("Subscribing to game channel with", gameId, orientation);
            ably.channels.get(gameId).subscribe(orientation, (msg) => {
                let data = msg.data;
                if (data === "Game is starting") {
                    setCurrentGameSettings((prev) => ({ ...prev, status: "Playing" }));
                } else if (data === "Opponent resigned") {
                    setCurrentGameSettings((prev) => ({ ...prev, status: "Opponent resigned!" }));
                }

                console.log("Message received:", data);
            });

            return () => {
                console.log("Unsubscribing from previous channel", gameId, orientation);
                ably.channels.get(gameId).unsubscribe(orientation);
            }
        }
    }, [ably, gameId, orientation]);

    return (
        <div className="chessboard">
            <Chessboard
                className="board"
                position={game.fen()}
                onPieceDrop={onDrop}
                boardOrientation={orientation}
                isDraggablePiece={({ piece }) => piece[0] === orientation[0]}
                arePiecesDraggable={!isGameOver}
                customSquareStyles={{ ...squareStyles, ...checkStyle }}
            />
            {playing === false && <div className="mist-overlay"></div>}
            <GameOverCard className="card" />
            {process.env.NODE_ENV === "development" && (
                <>
                    <button onClick={forcegame}>Force Game</button>
                    <button onClick={shiftMaze}>Shift Maze</button>
                </>
            )}
        </div>
    );
}
