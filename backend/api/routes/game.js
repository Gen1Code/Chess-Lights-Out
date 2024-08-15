import express from "express";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@vercel/postgres";
import { publish, getMessageFromQueue } from "../lib/pubsub.js";
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

let queuePrefix = process.env.ABLY_API_KEY.split(".")[0] + ":";

async function createGame(gameId, userId, color, settings) {
    try {
        if(color === "white") {
            await sql`INSERT INTO games (game_id, white_player, lights_out_setting, maze_setting) VALUES (${gameId}, ${userId}, ${settings.lightsOut}, ${settings.maze})`;
        }else{
            await sql`INSERT INTO games (game_id, black_player, lights_out_setting, maze_setting) VALUES (${gameId}, ${userId}, ${settings.lightsOut}, ${settings.maze})`;
        }

        return true;
    } catch (err) {
        console.error("Failed to create game:", err);
    }
    return false;
}

async function addPlayerAndStartGame(gameId, userId, color, maze) {
    try {
        // Add Player UID
        // Change status to ongoing
        // Add Maze if it exists

        if (maze === null) {
            if(color === "white") {
                await sql`UPDATE games SET white_player = ${userId}, status = 'ongoing' WHERE game_id = ${gameId}`;
            }else{
                await sql`UPDATE games SET black_player = ${userId}, status = 'ongoing' WHERE game_id = ${gameId}`;
            }
        } else {
            if(color === "white") {
                await sql`UPDATE games SET white_player = ${userId}, maze = ${JSON.stringify(maze)}, status = 'ongoing' WHERE game_id = ${gameId}`;
            }else{
                await sql`UPDATE games SET black_player = ${userId}, maze = ${JSON.stringify(maze)}, status = 'ongoing' WHERE game_id = ${gameId}`;
            }
        }

        return true;
    } catch (err) {
        console.error("Failed to add player to game and/or start the game", err);
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

        let maze = mazeIsOn ? getRandomMaze() : null;

        // Add the player to the game and start the game in the database
        addPlayerAndStartGame(gameId, req.userId, myColor, maze);

        //Publish to GID channel
        console.log("Publishing to GID channel", msg.color, "Game is starting");
        publish(gameId, msg.color, "Game is starting");

        // Publish the maze if it is on
        if (mazeIsOn) {
            console.log("Publishing maze to GID channel", maze);
            publish(gameId, "maze", maze);
        }

        res.json({ message: "Game Found", gameId: gameId, color: myColor });
    } else {
        // If no game is found, create a new game
        let gameId = uuidv4();
        let color = Math.random() < 0.5 ? "white" : "black";

        let msg = { gameId: gameId, color: color, settings: settings };

        // Publish the message to the queue
        console.log("Publishing to queue", queueName);
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

    console.log("Publishing to GID channel", otherColor, "Opponent resigned");
    // Publish to the game channel that the game is finished
    publish(gameId, otherColor, "Opponent resigned");

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

    moves.push(moveString);

    if (mazeIsOn) {
        // If promotion is defined, add it to the move
        if (move.promotion !== undefined) {
            matchingMove.promotion = move.promotion;
        }

        makeMoveInMaze(chessGame, matchingMove);

        console.log("After Move", chessGame.fen());
    } else {
        chessGame.move(move);
    }

    let newBoard = chessGame.fen();
    let newMaze = maze;

    if (mazeSetting === "Shift") {
        newMaze = scramble(maze, 10);
    }

    let gameIsOver = false;
    let gameOverMsg = "";
    if (mazeIsOn) {
        gameOverMsg = gameOverInMaze(chessGame, newMaze, moves, mazeSetting);
        gameIsOver = gameOverMsg !== "";
    } else {
        gameIsOver = chessGame.isGameOver();
        gameOverMsg = gameOverMessage(chessGame);
    }

    let statusSetInQuery = gameIsOver ? ", status = 'finished'" : "";

    // Update the database
    if (mazeIsOn) {
        if(gameIsOver){
            await sql`UPDATE games SET moves = ${JSON.stringify(moves)}, maze = ${JSON.stringify(newMaze)}, board = ${newBoard}, status = 'finished' WHERE game_id = ${gameId}`;
        }else{
            await sql`UPDATE games SET moves = ${JSON.stringify(moves)}, maze = ${JSON.stringify(newMaze)}, board = ${newBoard} WHERE game_id = ${gameId}`;
        }
    } else {
        if(gameIsOver){
            await sql`UPDATE games SET moves = ${JSON.stringify(moves)}, board = ${newBoard}, status = 'finished' WHERE game_id = ${gameId}`;
        }else{
            await sql`UPDATE games SET moves = ${JSON.stringify(moves)}, board = ${newBoard} WHERE game_id = ${gameId}`;
        }
    }

    console.log("Publishing to GID channel", otherColor, moveString);
    // Publish the move to the game channel
    publish(gameId, otherColor, moveString);

    // Publish the new maze if it was shifted
    if (mazeSetting === "Shift") {
        console.log("Publishing maze to GID channel", newMaze);
        publish(gameId, "maze", newMaze);
    }

    // // If the game is over, publish the game over message
    if (gameIsOver) {
        console.log("Publishing game Over to GID channel", gameOverMsg);
        publish(gameId, "black", gameOverMsg);
        publish(gameId, "white", gameOverMsg);
    }

    res.json({ message: "Move sent" });
});

export default router;
