import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();
const listEndpoints = require('express-list-endpoints');

// Importing the routes, to connect with files in the Routes folder
import mongoUsersRoute from './Routes/mongo-users';
import mongoSurfPostsRoute from './Routes/mongo-surfposts';

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailable' })
  }
});

// Adding the Routes folder files router to the application at the root path
app.use("/", mongoUsersRoute);
app.use("/", mongoSurfPostsRoute);

// start of routes
app.get("/", (req, res) => {
  res.json(listEndpoints(app));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
