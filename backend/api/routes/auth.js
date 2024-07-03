import express from 'express';
import db from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

async function createUser(user_id, name){
    const client = await db.connect();
    try {
      await client.query(
        `INSERT INTO users (user_id, name) VALUES ($1, $2)`,
        [user_id, name]
      );
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      client.release();
    }
  }

// TODO: Error handling, refactoring, proper name getting
router.post('/', async (req, res) => {
    if(req.userId) return res.send('Already Have a cookie');

    const userId = uuidv4();
    const name = req.body;
    console.log(name);
    await createUser(userId,name);

    res.cookie("user_id", userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: true
    });

    res.send('Data response');
});

export default router;