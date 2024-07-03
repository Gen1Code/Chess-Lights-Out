import express from 'express';
import router from './routes/root.js';
import cookieParser from 'cookie-parser';
import userCookieMiddleware from './middleware/cookies.js';
import cors from 'cors';

const server = express();

// Middleware
server.use(cors({
  origin: 'https://gen1code.github.io',
  credentials: true
}));

if (process.env.NODE_ENV !== 'production') {
  server.use(cors({
    origin:  ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }));
}

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

server.use(cookieParser());
server.use(userCookieMiddleware);

//Status check
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