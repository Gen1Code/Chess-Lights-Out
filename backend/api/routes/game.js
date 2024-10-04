import express from "express";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@vercel/postgres";
import { publish } from "../lib/pubsub.js";
import {
    possibleMoves,
    scramble,
    getRandomMaze,
    gameOverInMaze,
    makeMoveInMaze,
    gameOverMessage,
} from "../lib/chessUtils.js";
import { Chess } from "chess.js";

dotenv.config();
const router = express.Router();

async function createGame(gameId, userId, color, settings) {
    try {
        await sql`INSERT INTO games 
            (game_id, ${color}_player, lights_out_setting, maze_setting, time_setting) 
        VALUES 
            (${gameId}, ${userId}, ${settings.lightsOut}, ${settings.maze}, ${settings.timeLimit})`;
        console.log("Game created, gameId:", gameId);
        return true;
    } catch (err) {
        console.error("Failed to create game:", err);
    }
    return false;
}

async function addPlayerAndStartGame(gameId, userId, color, maze, timeLimit) {
    try {
        // Add Player UID
        // Change status to ongoing
        // Add Maze if it exists
        //Set the time of game start

        let currentTime = Date.now();
        let updates = {
            status: "ongoing",
            activity_timestamp: currentTime,
            [color + "_player"]: userId,
            white_time_remaning: timeLimit,
            black_time_remaning: timeLimit,
        };
        if (maze !== null) {
            updates.maze = JSON.stringify(maze);
        }

        await sql`UPDATE games SET
            ${Object.entries(updates)
                .map(([key, value]) => `${key} = ${value}`)
                .join(", ")}
        WHERE game_id = ${gameId}`;

        return true;
    } catch (err) {
        console.error(
            "Failed to add player to game and/or start the game",
            err
        );
    }
    return false;
}

router.post("/play", async (req, res) => {
    // Check if the user is already in an ongoing game
    let game =
        await sql`SELECT game_id FROM games WHERE (white_player = ${req.userId} OR black_player = ${req.userId}) AND status != 'finished'`;

    if (game.rows.length > 0) {
        return res.json({
            message: "You are already in a game",
            gameId: game.rows[0].game_id,
        });
    }

    let settings = req.body;
    let userId = req.userId;

    console.log("Settings", settings);

    let mazeIsOn = settings.maze !== "Off";
    let lightsOutIsOn = settings.lightsOut;
    let timeLimit = settings.timeLimit;

    let openGames =
        await sql`SELECT game_id, white_player FROM games WHERE status = 'not started' AND lights_out_setting = ${lightsOutIsOn} AND maze_setting = ${settings.maze} AND time_setting = ${timeLimit}`;

    // If a game is found
    if (openGames.rows.length > 0) {
        // console.log("Open Games have been Found");

        let game = openGames.rows[0];
        let gameId = game.game_id;
        let myColor = game.white_player ? "black" : "white";
        let otherColor = game.white_player ? "white" : "black";

        let maze = mazeIsOn ? getRandomMaze() : null;

        // Add the player to the game and start the game in the database
        await addPlayerAndStartGame(gameId, userId, myColor, maze, timeLimit);

        //Publish Start Game to Ably channel
        await publish(gameId, otherColor, "Game is starting");

        // Publish the maze if it is on
        if (mazeIsOn) {
            await publish(gameId, "maze", maze);
        }

        res.json({ message: "Game Found", gameId: gameId, color: myColor });
    } else {
        // If no game is found, create a new game
        let gameId = uuidv4();
        let color = Math.random() < 0.5 ? "white" : "black";

        // Create a new game in the database
        await createGame(gameId, userId, color, settings);

        // Return the game id and color to the user
        res.json({
            message: "Looking For a Game",
            gameId: gameId,
            color: color,
        });
    }
});

router.get("/cancel", async (req, res) => {
    // Check if the user is already in an ongoing game
    let game =
        await sql`SELECT game_id FROM games WHERE (white_player = ${req.userId} OR black_player = ${req.userId}) AND status = 'not started'`;

    if (game.rows.length == 0) {
        return res.json({
            message: "No Game to Cancel",
        });
    }

    let cancel =
        await sql`DELETE FROM games WHERE game_id = ${game.rows[0].game_id}`;
    console.log("Game Cancelled:", game.rows[0].game_id);
    res.json({ message: "Game Cancelled", gameId: "" });
});

router.post("/get", async (req, res) => {
    let gameId = req.body.gameId;
    let game = await sql`SELECT * FROM games WHERE game_id = ${gameId}`;

    if (game.rows.length === 0) {
        return res.json({ message: "Game not found" });
    }

    let color;
    if (game.rows[0].white_player === req.userId) {
        color = "white";
    } else if (game.rows[0].black_player === req.userId) {
        color = "black";
    } else {
        return res.json({ message: "You are not in this game" });
    }

    const {
        status: gameStatus,
        moves: moves,
        lights_out_setting: gameLightsOutSetting,
        board: gameBoard,
        maze: gameMaze,
        maze_setting: gameMazeSetting,
    } = game.rows[0];

    res.json({
        message: "Game",
        color: color,
        gameId: gameId,
        status: gameStatus,
        moves: JSON.parse(moves),
        board: gameBoard,
        lightsOutSetting: gameLightsOutSetting,
        maze: JSON.parse(gameMaze),
        mazeSetting: gameMazeSetting,
    });
});

router.post("/resign", async (req, res) => {
    let gameId = req.body.gameId;
    console.log("Resigning:", gameId);
    let game =
        await sql`SELECT white_player, black_player FROM games WHERE game_id = ${gameId}`;

    if (game.rows.length === 0) {
        return res.json({ message: "Game not found" });
    }

    let color;
    if (game.rows[0].white_player === req.userId) {
        color = "white";
    } else if (game.rows[0].black_player === req.userId) {
        color = "black";
    } else {
        return res.json({ message: "You are not in this game" });
    }

    let otherColor = color === "white" ? "black" : "white";

    // Update the game status to finished
    await sql`UPDATE games SET status = 'finished' WHERE game_id = ${gameId}`;

    // console.log("Publishing to GID channel", otherColor, "Opponent resigned");
    // Publish to the game channel that the game is finished
    await publish(gameId, otherColor, "Opponent resigned");

    res.json({ message: "Resigned" });
});

router.post("/move", async (req, res) => {
    let userId = req.userId;
    let gameId = req.body.gameId;
    let move = req.body.move;

    let game = await sql`SELECT * FROM games WHERE game_id = ${gameId}`;

    if (game.rows.length === 0) {
        return res.json({ message: "Game not found" });
    }

    if (game.rows[0].status !== "ongoing") {
        return res.json({ message: "Game is not ongoing" });
    }

    let color;
    if (game.rows[0].white_player === userId) {
        color = "white";
    } else if (game.rows[0].black_player === userId) {
        color = "black";
    } else {
        return res.json({ message: "You are not in this game" });
    }
    let otherColor = color === "white" ? "black" : "white";

    let board = game.rows[0].board;
    let moves = JSON.parse(game.rows[0].moves);
    let mazeSetting = game.rows[0].maze_setting;
    let mazeIsOn = mazeSetting !== "Off";

    let chessGame;
    if (mazeIsOn) {
        chessGame = new Chess(board);
    } else {
        chessGame = new Chess();
        chessGame.loadPgn(moves.join(" ")); // TODO: check if this works might need to add turn numbers
    }

    let turn = chessGame.turn();

    if (color[0] !== turn) {
        return res.json({ message: "It's not your turn" });
    }

    let possMoves;
    let maze = JSON.parse(game.rows[0].maze);

    if (mazeIsOn) {
        possMoves = possibleMoves(chessGame, maze);
    } else {
        possMoves = chessGame.moves({ verbose: true });
    }

    let matchingMove = null;
    for (let i = 0; i < possMoves.length; i++) {
        if (possMoves[i].from === move.from && possMoves[i].to === move.to) {
            matchingMove = possMoves[i];
            break;
        }
    }

    if (matchingMove === null) {
        return res.json({ message: "Invalid move" });
    }

    let moveString = move.from + move.to;
    moveString += move.promotion ? move.promotion : "";

    if (mazeIsOn) {
        // If promotion is defined, add it to the move
        if (move.promotion !== undefined) {
            matchingMove.promotion = move.promotion;
        }
        makeMoveInMaze(chessGame, matchingMove);
    } else {
        chessGame.move(move);
    }

    let newBoard = chessGame.fen();
    let newMaze = maze;

    if (mazeSetting === "Shift") {
        newMaze = scramble(maze, 25);
    }

    let gameIsOver = false;
    let gameOverMsg = "";

    let currentTime = Date.now();
    let moveTimeTaken = currentTime - game.rows[0].activity_timestamp;
    let remaingTimeLeft =
        color === "white"
            ? game.rows[0].white_time_remaning - moveTimeTaken
            : game.rows[0].black_time_remaning - moveTimeTaken;

    // Check for the possible game endings
    if (remaingTimeLeft <= 0) {
        gameIsOver = true;
        gameOverMsg = color + " has Run out of Time";
    } else {
        moves.push(moveString);
        if (mazeIsOn) {
            gameOverMsg = gameOverInMaze(
                chessGame,
                newMaze,
                moves,
                mazeSetting
            );
            gameIsOver = gameOverMsg !== "";
        } else {
            gameIsOver = chessGame.isGameOver();
            gameOverMsg = gameOverMessage(chessGame);
        }
    }

    let movesDB = JSON.stringify(moves);

    // Update the database
    let updates = {
        moves: movesDB,
        board: newBoard,
        activity_timestamp: currentTime,
    };

    if (mazeIsOn) {
        updates.maze = JSON.stringify(newMaze);
    }

    if (gameIsOver) {
        updates.status = "finished";
    }

    if (remaingTimeLeft > 0) {
        updates[color + "_time_remaining"] = remaingTimeLeft;
    }

    await sql`UPDATE games SET
        ${Object.entries(updates)
            .map(([key, value]) => `${key} = ${value}`)
            .join(", ")}
    WHERE game_id = ${gameId}`;

    // console.log("Publishing to GID channel", otherColor, moveString);
    // Publish the move to the game channel
    await publish(gameId, otherColor, moveString);

    // Publish the new maze if it was shifted
    if (mazeSetting === "Shift") {
        // console.log("Publishing maze to GID channel", newMaze);
        await publish(gameId, "maze", newMaze);
    }

    // // If the game is over, publish the game over message
    if (gameIsOver) {
        // console.log("Publishing game Over to GID channel", gameOverMsg);
        await publish(gameId, "black", gameOverMsg);
        await publish(gameId, "white", gameOverMsg);
    }

    res.json({ message: "Move sent" });
});

export default router;
