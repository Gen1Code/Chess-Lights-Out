import express from "express";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import db from "../lib/database.js";
import { publish, getMessageFromQueue } from "../lib/pubsub.js";

dotenv.config();
const router = express.Router();

let queuePrefix = process.env.ABLY_API_KEY.split(".")[0] + ":";

async function createGame(gameId, userId, color, settings) {
    try {
        if (color === "white") {
            await db.query(
                `INSERT INTO games (game_id, white_player, lights_out, maze) VALUES ($1, $2, $3, $4)`,
                [gameId, userId, settings.lightsOut, settings.maze]
            );
        } else {
            await db.query(
                `INSERT INTO games (game_id, black_player, lights_out, maze) VALUES ($1, $2, $3, $4)`,
                [gameId, userId, settings.lightsOut, settings.maze]
            );
        }

        return true;
    } catch (err) {
        console.error("Failed to create game");
    }
    return false;
}

async function addPlayerToGame(gameId, userId, color) {
    try {
        //Also change status to ongoing
        if (color === "white") {
            await db.query(
                `UPDATE games SET white_player = $1, status = 'ongoing' WHERE game_id = $2`,
                [userId, gameId]
            );
        } else {
            await db.query(
                `UPDATE games SET black_player = $1, status = 'ongoing' WHERE game_id = $2`,
                [userId, gameId]
            );
        }
        return true;
    } catch (err) {
        console.error("Failed to add player to game");
    }
    return false;
}

router.post("/play", async (req, res) => {
    // Check if the user is already in an ongoing game
    let game = await db.query(
        `SELECT game_id FROM games WHERE (white_player = $1 OR black_player = $1) AND status != $2`,
        [req.userId, "finished"]
    );

    if (game.rows.length > 0) {
        return res.json({
            message: "You are already in a game",
            gameId: game.rows[0].game_id,
        });
    }

    let settings = req.body;
    console.log("settings", settings);
    let mazeIsOn = settings.maze !== "Off";
    let lightsOutIsOn = settings.lightsOut;

    let queueName =
        queuePrefix +
        (mazeIsOn ? "maze" : "normal") +
        "-" +
        (lightsOutIsOn ? "lightsout" : "normal");

    const message = await getMessageFromQueue(queueName);

    // If a message is found, it means a game is found
    if (message !== null) {
        let msg = JSON.parse(message.data);

        let gameId = msg.gameId;
        let myColor = msg.color === "white" ? "black" : "white";

        // Add the player to the game in the database
        addPlayerToGame(gameId, req.userId, myColor);

        //Publish to GID channel
        publish(gameId, msg.color, "Game is starting");

        res.json({ message: "Game Found", gameId: gameId, color: myColor });
    } else {
        // If no game is found, create a new game
        let gameId = uuidv4();
        let color = Math.random() < 0.5 ? "white" : "black";

        let msg = { gameId: gameId, color: color, settings: settings };

        // Publish the message to the queue
        publish(queueName, "gameCreation", JSON.stringify(msg));

        // Create a new game in the database
        createGame(gameId, req.userId, color, settings);

        // Return the game id and color to the user
        res.json({
            message: "Looking For a Game",
            gameId: gameId,
            color: color,
        });
    }
});

router.post("/get", async (req, res) => {
    let gameId = req.body.gameId;
    let game = await db.query(`SELECT * FROM games WHERE game_id = $1`, [
        gameId,
    ]);

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
        moves,
        lights_out: gameLightsOut,
        board: gameBoard,
        maze: gameMaze,
        maze_tree: gameMazeTree,
    } = game.rows[0];

    // If the game is lights out, return the viewable board
    if (gameLightsOut) {
        let boardObj = JSON.parse(gameBoard);
        //TODO: change the board to only show the correct litup squares
        let boardToSend = gameBoard;
        return res.json({
            message: "Game",
            color: color,
            gameId: gameId,
            status: gameStatus,
            board: boardToSend,
            lightsOut: gameLightsOut,
            maze: gameMaze,
            mazeTree: gameMazeTree,
        });
    }

    res.json({
        message: "Game",
        color: color,
        gameId: gameId,
        status: gameStatus,
        moves: moves,
        board: gameBoard,
        maze: gameMaze,
        mazeTree: gameMazeTree,
    });
});

router.post("/resign", async (req, res) => {
    let gameId = req.body.gameId;
    let game = await db.query(
        `SELECT white_player, black_player FROM games WHERE game_id = $1`,
        [gameId]
    );

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
    await db.query(`UPDATE games SET status = 'finished' WHERE game_id = $1`, [
        gameId,
    ]);

    // Publish to the game channel that the game is finished
    publish(gameId, otherColor, "Opponent resigned");

    res.json({ message: "Resigned" });
});

router.post("/move", async (req, res) => {
    let userId = req.userId;
    let gameId = req.body.gameId;
    let move = req.body.move;

    let game = await db.query(`SELECT * FROM games WHERE game_id = $1`, [
        gameId,
    ]);

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

    let moves = game.rows[0].moves;
    moves = moves ? JSON.parse(moves) : [];
    
    let board = game.rows[0].board;
    let mazeTree = game.rows[0].maze_tree;

    // TODO: Check if it's the player's move is appropriate
    // if not return json message
    // ? Possibly add turn to db schema, to check if it's the player's turn

    moves.push(move);

    //TODO: Update the board state and change maze state

    // Update the board, moves, and maze in the database

    // Update the game moves in the database
    await db.query(`UPDATE games SET moves = $1 WHERE game_id = $2`, [
        JSON.stringify(moves),
        gameId,
    ]);

    // Publish the move to the game channel
    publish(gameId, otherColor, move);

    res.json({ message: "Move sent" });
});

export default router;
