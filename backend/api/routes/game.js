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
        if(color === "white"){
            await db.query(`INSERT INTO games (game_id, white_player, lights_out, maze) VALUES ($1, $2, $3, $4)`, [
                gameId,
                userId,
                settings.lightsOut,
                settings.maze,
            ]);
        }else{
            await db.query(`INSERT INTO games (game_id, black_player, lights_out, maze) VALUES ($1, $2, $3, $4)`, [
                gameId,
                userId,
                settings.lightsOut,
                settings.maze,
            ]);
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
        if(color === "white"){
            await db.query(`UPDATE games SET white_player = $1, status = 'ongoing' WHERE game_id = $2`, [
                userId,
                gameId,
            ]);
        }else{
            await db.query(`UPDATE games SET black_player = $1, status = 'ongoing' WHERE game_id = $2`, [
                userId,
                gameId,
            ]);
        }
        return true;
    } catch (err) {
        console.error("Failed to add player to game");
    }
    return false;
}

router.post("/play", async (req, res) => {
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
        publish(gameId, "gameStart", "Game is starting");

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
        res.json({ message: "looking For a game", gameId: gameId, color: color });
    }
});

export default router;
