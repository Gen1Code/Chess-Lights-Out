import express from "express";
import router from "./routes/root.js";
import cookieParser from "cookie-parser";
import userCookieMiddleware from "./middleware/cookies.js";
import getCorsConfig from "./middleware/cors.js";

const server = express();

// Middleware
server.use(getCorsConfig());

server.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

server.use(cookieParser());
server.use(userCookieMiddleware);

//Status check
server.get("/", (req, res) => {
  res.json({ message: "Express" });
});

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
