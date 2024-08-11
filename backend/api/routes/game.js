import express from "express";
import { publish, getMessageFromQueue } from "../lib/pubsub.js";

const router = express.Router();

let queueNames = ["7lsHZQ:maze-static-normal"];

router.post("/play", async (req, res) => {
    console.log("settings", req.body);

    const messages = await getMessageFromQueue(queueNames[0]);

    console.log("messages", messages);
    if (messages !== null) {
        res.json({ message: "Game Found" });
    } else {
        console.log("publishing settings");
        // Publish the settings to the queue (temp)
        publish(queueNames[0], 'settings', JSON.stringify(req.body));
        res.json({ message: "looking For a game" });
    }

});

export default router;
