import express from "express";
import dotenv from "dotenv";
import { publish, getMessageFromQueue } from "../lib/pubsub.js";

dotenv.config();
const router = express.Router();

let queuePrefix = process.env.ABLY_API_KEY.split(".")[0] + ":";

router.post("/play", async (req, res) => {
    console.log("settings", req.body);
    let mazeIsOn = req.body.maze !== "Off";
    let lightsOutIsOn = req.body.lightsOut;

    let queueName =
        queuePrefix +
        (mazeIsOn ? "maze" : "normal") +
        "-" +
        (lightsOutIsOn ? "lightsout" : "normal");

    const messages = await getMessageFromQueue(queueName);

    console.log("messages", messages);
    if (messages !== null) {
        res.json({ message: "Game Found" });
    } else {
        console.log("publishing settings");
        // Publish the settings to the queue (temp)
        publish(queueName, "settings", JSON.stringify(req.body));
        res.json({ message: "looking For a game" });
    }
});

export default router;
