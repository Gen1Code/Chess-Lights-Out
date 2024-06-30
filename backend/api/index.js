import express from 'express';
import router from './routes/root.js';

const server = express();

server.get("/", (req, res) => { res.send("Express"); });

// Use Router
server.use(router);

// Catch all routes
server.all("*", async (req, res) => {
  res.status(404).json({ success: false, message: "Not found.", code: 404 });
});

// Define the port and start listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;