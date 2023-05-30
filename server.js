import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();
const listEndpoints = require('express-list-endpoints');

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

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 14
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  }
});

const User = mongoose.model("User", userSchema);

const userPostSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  createdBy: {
    type: String,
    required: true
  },
  numOfLikes: {
    type: Number,
    default: 0
  },
  likedBy: {
    type: [String],
    default: []
  },
  savedFavBy: {
    type: [String],
    default: []
  }
});

const UserPost = mongoose.model("Userpost", userPostSchema);

// Authenticate the user
const AuthenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({ accessToken: accessToken });
    if (user) {
      next();
    } else {
      res.status(401).json({
        success: false,
        response: "Please log in"
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    });
  }
}

// Start defining your routes here
app.get("/", (req, res) => {
  res.json(listEndpoints(app));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
