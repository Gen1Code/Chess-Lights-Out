import express from 'express';
import db from '../lib/database.js';

const server = express();

server.get("/", (req, res) => res.send("Express on Vercel"));

server.get("/test", (req, res) => res.send("Test"));
server.get("/testdb", async(req, res) => {
    const result = await db.query("SELECT * FROM users LIMIT 5");
    res.json(result.rows);
});

// Define the port and start listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;