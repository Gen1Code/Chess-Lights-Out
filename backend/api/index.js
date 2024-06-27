const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/hello", (req, res) => res.send("Hello from API"));
app.get("/test", (req, res) => res.send("Test"));

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;