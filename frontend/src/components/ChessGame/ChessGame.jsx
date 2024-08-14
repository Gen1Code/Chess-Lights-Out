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
    gameOverMessageInMaze,
    isGameOverInMaze,
    makeMoveInMaze,
} from "@utils/OriginShiftMaze";
import { styleForLightsOut, getLitupSquares } from "@utils/LightsOutUtils";
import { gameOverMessage, findKing, SQUARES } from "@utils/ChessUtils";

import "./ChessGame.css";
import { useAbly } from "ably/react";

export function ChessGame() {
    const {
        currentGameSettings,
        setCurrentGameSettings,
        gameId,
        game,
        setGame,
        maze,
        setMaze,
        moves,
        setMoves,
    } = useContext(GameContext);

    let ably = useAbly();
    if (ably === "null") {
        ably = null;
    }

    const mazeSetting = currentGameSettings.maze;
    const singlePlayer = currentGameSettings.mode === "Single";
    const mazeIsOn = mazeSetting !== "Off";
    const playing = currentGameSettings.status === "Playing";
    const justStarted = currentGameSettings.status === "Starting";
    const orientation = currentGameSettings.color;

    const [squareStyles, setSquareStyles] = useState({});
    const [checkStyle, setCheckStyle] = useState({});

    const turn = game.turn() === "w" ? "white" : "black";
    const inCheck = mazeIsOn
        ? inCheckInMaze(game, maze) && turn === orientation
        : game.inCheck() && turn === orientation;
    const isGameOver = justStarted
        ? false
        : mazeIsOn
        ? isGameOverInMaze(game, maze, moves, mazeSetting)
        : game.isGameOver();

    function makeAMove(move) {
        const gameCopy = new Chess();

        if (mazeIsOn) {
            gameCopy.load(game.fen());

            let possMoves = possibleMoves(gameCopy, maze);
            let matchingMove = null;
            for (let i = 0; i < possMoves.length; i++) {
                if (
                    possMoves[i].from === move.from &&
                    possMoves[i].to === move.to
                ) {
                    matchingMove = possMoves[i];
                    break;
                }
            }
            if (matchingMove === null) {
                console.log("Invalid move", move);
                return;
            }

            if (move.promotion !== undefined) {
                matchingMove.promotion = move.promotion;
            }

            makeMoveInMaze(gameCopy, matchingMove);
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
        let newMoves = moves;
        let moveString = move.from + move.to;
        moveString += move.promotion ? move.promotion : "";
        console.log("Your move made:", moveString);
        newMoves.push(moveString);
        setMoves(newMoves);
        setGame(gameCopy);
    }

    function onDrop(sourceSquare, targetSquare, piece) {
        if (turn !== orientation || !playing) return;

        let move = {
            from: sourceSquare,
            to: targetSquare,
        };

        //Only add the piece to the move if it's a pawn promotion
        if (game.get(sourceSquare).type !== piece[1].toLowerCase()) {
            move.promotion = piece[1].toLowerCase();
        }

        makeAMove(move);
    }

    //Dev testing functions (remove when done)
    function forcegame() {
        let fen;
        // Checkmate Potential
        // fen = "k7/6Q1/3N4/8/3b3q/8/8/5K2 w - - 0 40";
        // Pawn Promotion
        fen = "8/PPPK4/8/8/8/8/4kppp/8 w - - 0 40";
        // Insufficient Material
        // fen = "k7/8/8/8/8/8/8/K7 w - - 0 1";
        // About to be 50 move rule
        // fen = "kb6/8/8/8/8/8/8/K7 w - - 99 1";
        // Stalemate Potential
        // fen = "5K2/5P1k/7p/7P/8/8/8/6R1 w - - 0 1";
        // threefold repetition
        // fen = "1K6/8/2q5/2b5/3N4/4BQ2/7k/8 w - - 0 1";
        // Maze threefold repetition
        // fen = "8/2K5/8/8/7N/8/3N4/7k w - - 0 1";

        if (orientation === "black") {
            fen = fen.replace("w", "b");
        }

        let g = new Chess();
        g.load(fen);
        setGame(g);
    }
    function shiftMaze() {
        setMaze(scramble(maze, 400));
    }

    function botMove(g = game, m = maze) {
        // console.log("botMove triggered with:", orientation, turn, mazeIsOn);
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
            makeMoveInMaze(gameCopy, move);
        } else {
            gameCopy.move(move);
        }

        let moveString = move.from + move.to;
        moveString += move.promotion ? move.promotion : "";
        console.log("Bot move made:", moveString);
        setMoves([...moves, moveString]);
        setGame(gameCopy);
    }

    function styleSquares(game, maze, orientation) {
        // console.log("styleSquares triggered");

        let styles = {};
        let allSquares = new Set(SQUARES);

        allSquares.forEach((square) => {
            styles[square] = {};
        });

        let realMaze = mazeIsOn ? maze : null;

        if (currentGameSettings.lightsOut && playing) {
            styles = styleForLightsOut(
                styles,
                getLitupSquares(game, realMaze, orientation)
            );
        }

        if (mazeIsOn) {
            styles = styleForMaze(styles, getMazeBorders(maze), orientation);
        }

        // console.log("styles", styles);
        setSquareStyles(styles);
    }

    // On Turn Change
    useEffect(() => {
        if (playing && singlePlayer) {
            console.log("turn triggered:", turn);

            // if maze is in shift mode, make shifts
            if (mazeSetting === "Shift") {
                setMaze(scramble(maze, 10));
            }

            // if it's the computer's turn, make a move
            if (turn !== orientation) {
                botMove();
            }
        }
    }, [turn]);

    // If something occurs that changes the board, style the squares
    useEffect(() => {
        styleSquares(game, maze, orientation);
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

    // on game over, set the status
    useEffect(() => {
        if (isGameOver && playing) {
            console.log("Game over");
            if (mazeIsOn) {
                setCurrentGameSettings((prev) => ({
                    ...prev,
                    status: gameOverMessageInMaze(
                        game,
                        maze,
                        moves,
                        mazeSetting
                    ),
                }));
            } else {
                setCurrentGameSettings((prev) => ({
                    ...prev,
                    status: gameOverMessage(game),
                }));
            }
        }
    }, [isGameOver]);

    // On Status Change
    useEffect(() => {
        console.log("Status changed to:", currentGameSettings.status);

        if (justStarted) {
            console.log("Game started");

            const newGame = new Chess();
            const newMaze = getRandomMaze();

            setGame(newGame);
            setMaze(newMaze);
            setMoves([]);

            // if it's the computer's turn first, trigger a mov
            if (orientation === "black" && singlePlayer) {
                botMove(newGame, newMaze);
            }
            setCurrentGameSettings((prev) => ({ ...prev, status: "Playing" }));
        } else if (currentGameSettings.status === "Haven't started yet") {
            console.log("No Game has started yet");
        }
    }, [currentGameSettings.status]);

    useEffect(() => {
        if (ably && !singlePlayer) {
            console.log(
                "Subscribing to game channel with",
                gameId,
                orientation
            );
            ably.channels.get(gameId).subscribe(orientation, (msg) => {
                let data = msg.data;
                if (data === "Game is starting") {
                    setCurrentGameSettings((prev) => ({
                        ...prev,
                        status: "Starting",
                    }));
                } else if (data === "Opponent resigned") {
                    setCurrentGameSettings((prev) => ({
                        ...prev,
                        status: "Opponent resigned!",
                    }));
                } else {
                    //TODO: DIfferentiate between moves and board updates depeending on if lights out is on
                    let move = {
                        from: data.subString(0, 2),
                        to: data.subString(2, 4),
                    };

                    // Check if the move is a promotion
                    if (data.length > 4) {
                        move.promotion = data[4];
                    }

                    makeAMove(move);
                }

                console.log("Message received:", data);
            });
            ably.channels.get(gameId).subscribe("maze", (msg) => {
                let data = msg.data;
                setMaze(data);
                console.log("Message received:", data);
            });

            return () => {
                console.log(
                    "Unsubscribing from previous channel",
                    gameId,
                    orientation
                );
                ably.channels.get(gameId).unsubscribe(orientation);
                ably.channels.get(gameId).unsubscribe("maze");
            };
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
                arePiecesDraggable={playing}
                customSquareStyles={{ ...squareStyles, ...checkStyle }}
            />
            {!playing && <div className="mist-overlay"></div>}
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
