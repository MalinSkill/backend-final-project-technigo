import express, { response } from "express";
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
    required: true,
    unique: true
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
const authenticateUser = async (req, res, next) => {
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

// Registration route
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  // Perform email validation  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      response: 'Invalid email adress'
    });
  }
  try {
    const salt = bcrypt.genSaltSync();
    const newUser = await new User({
      username: username,
      password: bcrypt.hashSync(password, salt),
      email: email
    }).save();
    res.status(201).json({
      success: true,
      response: {
        username: newUser.username,
        email: newUser.email,
        id: newUser._id,
        accessToken: newUser.accessToken
      }
    })
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e
    })
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username })
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        response: {
          username: user.username,
          id: user._id,
          accessToken: user.accessToken
        }
      })
    } else {
      res.status(401).json({
        success: false,
        response: "Credentials do not match"
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    })
  }
});

// Get all posts from all users
app.get("/surfposts", async (req, res) => {
  try {
    const surferPosts = await UserPost.find().sort({ createdAt: 'desc' });
    res.status(200).json({
      success: true,
      response: surferPosts
    })
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e
    })
  }
})

// Post a single recommentdation
app.post("/surfposts", authenticateUser);
app.post("/surfposts", async (req, res) => {
  const { headline, location, message } = req.body;
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const surferposts = await new UserPost({ headline: headline, location: location, message: message, createdBy: user._id }).save();
    if (surferposts) {
      res.status(201).json({
        success: true,
        response: surferposts
      })
    }
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e
    })
  }
});

// endpoint for user's posts
app.get("/mysurfposts", authenticateUser);
app.get("/mysurfposts", async (req, res) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const mySurferPosts = await UserPost.find({ createdBy: user._id });
    if (mySurferPosts.length) {
      res.status(200).json({
        success: true,
        response: mySurferPosts
      })
    } else {
      res.status(404).json({
        success: false,
        response: "No posts found from this creator."
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    })
  }
});

// endpoint for user's saved favourites
app.get("/myfavsurfposts", authenticateUser);
app.get("/myfavsurfposts", async (req, res) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const userFavPosts = await UserPost.find({ savedFavBy: user._id });

    if (userFavPosts.length) {
      res.status(200).json({
        success: true,
        response: userFavPosts
      })
    } else {
      res.status(404).json({
        success: false,
        response: "No favourites saved."
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    })
  }
});

// endpoint for liking and unliking a post
app.patch("/surfposts/:surfPostId/like", authenticateUser);
app.patch("/surfposts/:surfPostId/like", async (req, res) => {
  const { surfPostId } = req.params;
  const accessToken = req.header("Authorization")
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const SpecificItem = await UserPost.findById(surfPostId);
    const likedByArray = SpecificItem.likedBy;
    const UserExist = likedByArray.find(userId => userId.toString() === user._id.toString());

    if (UserExist) {
      await UserPost.findByIdAndUpdate(surfPostId,
        {
          $inc: { numOfLikes: -1 },
          $pull: { likedBy: user._id }
        },
      )
    } else {
      await UserPost.findByIdAndUpdate(surfPostId,
        {
          $inc: { numOfLikes: 1 },
          $push: { likedBy: user._id }
        });
    }

    const LikedItem = await UserPost.findById(surfPostId)

    res.status(201).json({
      success: true,
      response: LikedItem
    })
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e
    })
  }
});

// endpoint for saving post as fav and removing from saved
app.patch("/surfposts/:surfPostId/addfav", authenticateUser);
app.patch("/surfposts/:surfPostId/addfav", async (req, res) => {
  const { surfPostId } = req.params;
  const accessToken = req.header("Authorization")
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const SpecificItem = await UserPost.findById(surfPostId);

    const favArray = SpecificItem.savedFavBy;
    const UserExist = favArray.find(userId => userId.toString() === user._id.toString());

    if (UserExist) {
      await UserPost.findByIdAndUpdate(surfPostId,
        {
          $pull: { savedFavBy: user._id }
        },
      )
    } else {
      await UserPost.findByIdAndUpdate(surfPostId,
        {
          $push: { savedFavBy: user._id }
        });
    }

    const SavedItem = await UserPost.findById(surfPostId)

    res.status(201).json({
      success: true,
      response: SavedItem
    })
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e
    })
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
