const express = require('express');
const app = express();

// Middleware and routes
app.use(express.json()); // Middleware to parse JSON requests

// Define a simple route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Get the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
