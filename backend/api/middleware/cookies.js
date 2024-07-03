import { v4 as uuidv4 } from "uuid";
import db from "../lib/database.js";

// TODO: Move to db handling
async function createUser(user_id){
  const client = await db.connect();
  try {
    await client.query(
      `INSERT INTO users (user_id) VALUES ($1)`,
      [user_id]
    );
  } catch (err) {
    console.error("Failed to create user:", err);
  } finally {
    client.release();
  }
}

const userCookieMiddleware = (req, res, next) => {
  if (!req.cookies.user_id) {
    const userId = uuidv4();
    res.cookie("user_id", userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: true
    });
    req.userId = userId;
    createUser(userId);
  } else {
    req.userId = req.cookies.user_id;
  }
  next();
};

export default userCookieMiddleware;