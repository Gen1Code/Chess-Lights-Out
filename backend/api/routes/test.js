import express from 'express';
import db from '../lib/database.js';

const router = express.Router();

router.get('/server', (req, res) => {
    res.send("Test")
});
  
router.get('/db', async (req, res) => {
    const result = await db.query("SELECT * FROM users LIMIT 5");
    res.json(result.rows);
});

export default router;