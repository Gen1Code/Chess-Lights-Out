
import dotenv from 'dotenv';
import express from 'express';
import { db } from '@vercel/postgres';

dotenv.config();
const app = express();

app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/hello", (req, res) => res.send("Hello from API"));
app.get("/test", (req, res) => res.send("Test"));

app.get("/testdb", async(req, res) => {
    const result = await db.query("SELECT * FROM users LIMIT 5");
    res.json(result.rows);
});

app.listen(3000, () => console.log("Server ready on port 3000."));

export default app;