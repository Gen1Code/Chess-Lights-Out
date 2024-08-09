import express from "express";
import router from "./routes/root.js";
import cookieParser from "cookie-parser";
import userCookieMiddleware from "./middleware/cookies.js";
import getCorsConfig from "./middleware/cors.js";

const app = express();

// Middleware
app.use(getCorsConfig());
app.options('*', getCorsConfig());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(cookieParser());
app.use(userCookieMiddleware);

app.use(express.json())

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

export default app;