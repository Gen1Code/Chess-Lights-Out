import express from "express";
import router from "./routes/root.js";
import cookieParser from "cookie-parser";
import userCookieMiddleware from "./middleware/cookies.js";
import getCorsConfig from "./middleware/cors.js";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();

// Middleware
app.use(getCorsConfig());

app.use((req, res, next) => {
  
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(cookieParser());
app.use(userCookieMiddleware);

//Status check
app.get("/", (req, res) => {
  res.json({ message: "Express" });
});

// Use Router
app.use(router);

// Catch all routes
app.all("*", async (req, res) => {
  res.status(404).json({ success: false, message: "Not found.", code: 404 });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong." });
});

// Define the port and start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? "https://gen1code.github.io" : "http://localhost:5173",
    credentials: true
  }
});

io.on("connection", async (socket) => {
  console.log("a user has connected!");

  socket.on("disconnect", () => {
    console.log("a user has disconnected!");
  });

  socket.on("auth check", async (localUserID) => {
    console.log("auth check");
    console.log("localUserID", localUserID);
    let result;
    // const userId = socket.handshake.auth.userId;
    // console.log("authUserID", userId);
    let cookie = socket.handshake.headers.cookie;
    let cookieUserID = cookie ? cookie.split("=")[1] : null;
    console.log("cookie", cookieUserID);

    // try {
    //   result = await client.sql`
    //       SELECT id FROM users WHERE id = ${userId};
    //     `;
    // } catch (e) {
    //   console.error(e);
    //   return;
    // }
    console.log("auth check", result);

    socket.emit("auth check", result);
  });
  if (!socket.recovered) {
    // TBD
  }
});

io.listen(4000, () => {
  console.log("Socket.io listening on *:4000");
});


export default app;
