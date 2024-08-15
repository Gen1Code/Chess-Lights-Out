import express from 'express';
import { sql } from '@vercel/postgres';
const router = express.Router();

router.get('/server', (req, res) => {
    res.json({ message: "Test" })
});
  
router.get('/db', async (req, res) => {
    const result = await sql`SELECT name FROM users LIMIT 5`;
    res.json(result.rows);
});

export default router;