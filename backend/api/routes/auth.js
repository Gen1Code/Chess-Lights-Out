import express from "express";
import db from "../lib/database.js";
import { getAuthTokenRequest } from "../lib/pubsub.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

async function createUser(userId, name) {
    try {
        await db.query(`INSERT INTO users (user_id, name) VALUES ($1, $2)`, [
            userId,
            name,
        ]);
        return true;
    } catch (err) {
        console.error("Failed to create user");
    }
    return false;
}

router.get("/ably", async (req, res) => {
    console.log("Getting auth token for user", req.userId);
    const tokenRequest = await getAuthTokenRequest(req.userId);
    // console.log(tokenRequest);
    res.json(tokenRequest);
});

router.get("/", async (req, res) => {
    if (req.cookies.user_id) {
        return res.json({ user_id: req.cookies.user_id });
    }else if (req.headers.authorization) {
        return res.json({ user_id: req.headers.authorization.split(" ")[1] });
    }
    res.json({ message: "No user_id Provided" });
});

router.post("/", async (req, res) => {
    if (req.cookies.user_id)
        return res.json({
            message: "Already Have a cookie",
            user_id: req.cookies.user_id,
        });

    let userId;
    // If the user isnt authenticated, create a new user
    if (!req.headers.authorization) {
        userId = uuidv4();
        const name = req.body.name;
        console.log("Creating new user with name: ", name);
        // Create a new user, if failed return an error
        let success = await createUser(userId, name);
        if (!success) {
            return res
                .status(500)
                .json({ success: false, message: "Failed to create user" });
        }
    } else {
        // If the user is authenticated, get the user id from the token
        userId = req.headers.authorization.split(" ")[1];
    }

    // Set the cookie
    res.cookie("user_id", userId, {
        maxAge: 100 * 365 * 24 * 60 * 60 * 1000, // 100 years
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });

    res.json({ user_id: userId });
});

export default router;
