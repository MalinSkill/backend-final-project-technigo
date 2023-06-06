import express from "express";
const router = express.Router()
import mongoose from "mongoose";
import authenticateUser from "../Middlewares/middlewares";
import User from '../Models/user';
import UserPost from "../Models/surfpost";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Get all posts from all users
router.get("/surfposts", async (req, res) => {
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
router.post("/surfposts", authenticateUser, async (req, res) => {
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
router.get("/mysurfposts", authenticateUser, async (req, res) => {
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
router.get("/myfavsurfposts", authenticateUser, async (req, res) => {
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
router.patch("/surfposts/:surfPostId/like", authenticateUser, async (req, res) => {
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
router.patch("/surfposts/:surfPostId/addfav", authenticateUser, async (req, res) => {
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

export default router;