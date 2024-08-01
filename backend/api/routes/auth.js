import express from "express";
import db from "../lib/database.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

async function createUser(user_id, name) {
  try {
    await db.query(`INSERT INTO users (user_id, name) VALUES ($1, $2)`, [
      user_id,
      name,
    ]);
    return true;

  } catch (err) {
    console.error("Failed to create user");
  }
  return false;
}

// TODO: proper name getting
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
    const name = req.body;
    console.log(name);
    // Create a new user, if failed return an error
    let success = await createUser(userId, name);
    if (!success) {
      return res.status(500).json({ success: false, message: "Failed to create user" });
    }
  } else {
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
