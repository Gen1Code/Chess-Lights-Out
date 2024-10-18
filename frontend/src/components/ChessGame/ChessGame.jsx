import { useEffect, useState, useContext, useRef } from "react";
import { GameContext } from "@context/GameContext";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GameOverCard } from "@components/GameOverCard";
import { ChessTimer } from "@components/ChessTimer";
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

import { useAbly } from "ably/react";
import { api } from "@utils/api";
import "./ChessGame.css";

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
        timesRemaining,
        setTimesRemaining,
        setActivityTimestamp,
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

    const gameRef = useRef(game);
    const currentGameSettingsRef = useRef(currentGameSettings);
    const mazeRef = useRef(maze);
    const movesRef = useRef(moves);
    const timesRemainingRef = useRef(timesRemaining);

    const turn = game.turn() === "w" ? "white" : "black";
    const inCheck = mazeIsOn
        ? inCheckInMaze(game, maze) && turn === orientation
        : game.inCheck() && turn === orientation;
    const isGameOver = checkForGameOver();

    function checkForGameOver() {
        if (!playing || !singlePlayer) {
            return false;
        }
        return mazeIsOn
            ? isGameOverInMaze(game, maze, moves, mazeSetting)
            : game.isGameOver();
    }

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
                return false;
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
                return false;
            }
        }
        let newMoves = moves;
        let moveString = move.from + move.to;
        moveString += move.promotion ? move.promotion : "";
        newMoves.push(moveString);
        setMoves(newMoves);
        setGame(gameCopy);
        return true;
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

        let moveWasValid = makeAMove(move);
        if (!singlePlayer && moveWasValid) {
            api("/game/move", "POST", {
                gameId: gameId,
                move: move,
            })
                .then((res) => {
                    setTimesRemaining((prevTimes) => {
                        const newTimes = [...prevTimes];
                        const playerIndex = orientation[0] === "w" ? 0 : 1;
                        newTimes[playerIndex] = res.timeRemaining;
                        return newTimes;
                    });
                    setActivityTimestamp(res.activityTimestamp);
                })
                .catch((error) => {
                    console.log("Error making move:", error);
                    //TODO: Retry Move depending on error
                });
        }
    }

    //Dev testing functions
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

        if (realMaze !== null) {
            styles = styleForMaze(styles, getMazeBorders(maze), orientation);
        }

        setSquareStyles(styles);
    }

    // On Turn Change
    useEffect(() => {
        if (playing && singlePlayer) {
            console.log("turn triggered:", turn);

            // if maze is in shift mode, make shifts
            if (mazeSetting === "Shift") {
                setMaze(scramble(maze, 25));
            }

            // if it's the computer's turn, make a move
            if (turn !== orientation) {
                botMove();
            }
        }
    }, [turn]);

    useEffect(() => {
        movesRef.current = moves;
        timesRemainingRef.current = timesRemaining;
    }, [moves, timesRemaining]);

    // If something occurs that changes the board, style the squares
    useEffect(() => {
        styleSquares(game, maze, orientation);
        gameRef.current = game;
        currentGameSettingsRef.current = currentGameSettings;
        mazeRef.current = maze;
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

    // on game over, set the status single player only
    useEffect(() => {
        if (isGameOver && playing && singlePlayer) {
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

            setGame(newGame);
            setMoves([]);
            //console.log("Setting Time Remainings to Time Limit");
            setTimesRemaining([
                currentGameSettings.timeLimit,
                currentGameSettings.timeLimit,
            ]);

            if (singlePlayer) {
                // Generate a random maze
                const newMaze = getRandomMaze();
                setMaze(newMaze);

                // if it's the computer's turn first, trigger a move
                if (orientation === "black") {
                    botMove(newGame, newMaze);
                }
            }

            setCurrentGameSettings((prev) => ({ ...prev, status: "Playing" }));
        } else if (currentGameSettings.status === "Haven't started yet") {
            console.log("No Game has started yet");
        }
    }, [currentGameSettings.status]);

    useEffect(() => {
        if (ably && !singlePlayer) {
            const gameChannel = ably.channels.get(gameId);
            gameChannel.setOptions({ params: { rewind: "0" } });
            gameChannel.subscribe(orientation, (msg) => {
                let dataSplit = msg.data.split(",");
                let dataStatus = dataSplit[0];

                if (dataStatus === "Game is starting") {
                    setCurrentGameSettings((prev) => ({
                        ...prev,
                        status: "Starting",
                    }));
                    setActivityTimestamp(dataSplit[1]);
                } else if (dataStatus === "Opponent resigned") {
                    setCurrentGameSettings((prev) => ({
                        ...prev,
                        status: "Opponent resigned!",
                    }));
                } else if (
                    // Check if the game is over
                    dataStatus === "Black is in Checkmate" ||
                    dataStatus === "White is in Checkmate" ||
                    dataStatus === "Stalemate" ||
                    dataStatus === "Insufficient Material" ||
                    dataStatus === "Threefold Repetition" ||
                    dataStatus === "50 Move Rule" ||
                    dataStatus === "White Ran Out of Time" ||
                    dataStatus === "Black Ran Out of Time"
                ) {
                    setCurrentGameSettings((prev) => ({
                        ...prev,
                        status: dataStatus,
                    }));
                } else {
                    console.log("Data received:", dataSplit);

                    let dataMove = dataSplit[0];

                    let move = {
                        from: dataMove.slice(0, 2),
                        to: dataMove.slice(2, 4),
                    };

                    // Check if the move is a promotion
                    if (dataMove.length > 4) {
                        move.promotion = dataMove[4];
                    }

                    let activityTimestamp = Number(dataSplit[1]);
                    let playerTimeRemaining = Number(dataSplit[2]);

                    const gameCopy = new Chess();

                    if (currentGameSettingsRef.current.maze !== "Off") {
                        gameCopy.load(gameRef.current.fen());

                        let possMoves = possibleMoves(
                            gameCopy,
                            mazeRef.current
                        );

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
                        }

                        if (move.promotion !== undefined) {
                            matchingMove.promotion = move.promotion;
                        }

                        makeMoveInMaze(gameCopy, matchingMove);
                    } else {
                        gameCopy.loadPgn(gameRef.current.pgn());

                        try {
                            gameCopy.move(move);
                        } catch (e) {
                            console.log("Invalid move", move);
                            console.error(e);
                        }
                    }
                    let newMoves = movesRef.current;
                    let moveString = move.from + move.to;
                    moveString += move.promotion ? move.promotion : "";
                    newMoves.push(moveString);

                    let tR = timesRemainingRef.current;
                    let otherPlayerIndex = orientation[0] === "w" ? 1 : 0;
                    tR[otherPlayerIndex] = playerTimeRemaining;

                    setMoves(newMoves);
                    setGame(gameCopy);
                    setTimesRemaining(tR);
                    setActivityTimestamp(activityTimestamp);
                }

            });
            const mazeChannel = ably.channels.get(gameId);
            // User might miss the first maze message so rewind and grab it
            mazeChannel.setOptions({ params: { rewind: "1" } });
            mazeChannel.subscribe("maze", (msg) => {
                let data = msg.data;
                setMaze(data);
            });

            return () => {
                ably.channels.get(gameId).unsubscribe(orientation);
                ably.channels.get(gameId).unsubscribe("maze");
            };
        }
    }, [ably, gameId, orientation, singlePlayer]);

    return (
        <div className="chessboard">
            <ChessTimer turn={turn}>
                {!playing && <div className="mist-overlay"></div>}
                <GameOverCard className="card" />

                <Chessboard
                    className="board"
                    // key={game.fen()} // This is a hack to force the board to update in Strict Mode, Context loading gives the library trouble Issue #119
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    boardOrientation={orientation}
                    isDraggablePiece={({ piece }) =>
                        piece[0] === orientation[0]
                    }
                    arePiecesDraggable={playing}
                    customSquareStyles={{ ...squareStyles, ...checkStyle }}
                />
            </ChessTimer>

            {process.env.NODE_ENV === "development" && (
                <>
                    <button onClick={forcegame}>Force Game</button>
                    <button onClick={shiftMaze}>Shift Maze</button>
                </>
            )}
        </div>
    );
}
