import express from "express";
const router = express.Router()
import mongoose, { trusted } from "mongoose";
import authenticateUser from "../Middlewares/middlewares";
import usePagination from "../Middlewares/pagination"
import User from '../Models/user';
import UserPost from "../Models/surfpost";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Get all posts from all users
router.get("/surfposts", usePagination, async (req, res) => {
  try {
    const { level, location, sort } = req.query
    const { pageHits, startIndex } = req.pagination

    // create variables with the default sort values
    let sortByProperty = 'createdAt';
    let sortDirection = 'desc';

    // check if sort query parameter is provided 
    if (sort === 'likesDesc') {
      sortByProperty = 'numOfLikes';
      sortDirection = 'desc';
    } else if (sort === 'likesAsce') {
      sortByProperty = 'numOfLikes';
      sortDirection = 'asc';
    }
    let surferPosts = await UserPost.find()
      .sort({ [sortByProperty]: sortDirection })
      .skip(startIndex)
      .limit(pageHits);

    let filteredPosts = surferPosts;

    if (level) {
      filteredPosts = filteredPosts.filter(post => post.level === level);
    }
    if (location) {
      const regex = new RegExp(location, 'i')
      filteredPosts = filteredPosts.filter(post => regex.test(post.location));
    }
    res.status(200).json({
      success: true,
      response: filteredPosts
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
  const { headline, location, message, level } = req.body;
  const accessToken = req.header("Authorization");
  // check to see if value of level is valid
  if (level && !['beginner', 'intermediate', 'advanced'].includes(level)) {
    return res.status(400).json({
      success: false,
      response: 'Invalid level value'
    });
  }
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const surferposts = await new UserPost({
      headline: headline.charAt(0).toUpperCase() + headline.slice(1).toLowerCase(),
      location: location.charAt(0).toUpperCase() + location.slice(1).toLowerCase(),
      message: message,
      createdBy: user._id,
      level: level
    }).save();
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
router.get("/mysurfposts", authenticateUser, usePagination, async (req, res) => {
  const accessToken = req.header("Authorization");
  try {
    const { sort } = req.query
    const { pageHits, startIndex } = req.pagination
    // create variable with the default sort value
    let sortDirection = 'desc';

    // check if sort query parameter is provided 
    if (sort === 'createdAsce') {
      sortDirection = 'asc';
    }

    const user = await User.findOne({ accessToken: accessToken });
    const mySurferPosts = await UserPost.find({ createdBy: user._id })
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(pageHits);

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
router.get("/myfavsurfposts", authenticateUser, usePagination, async (req, res) => {
  const accessToken = req.header("Authorization");
  try {
    const { location } = req.query;
    const { startIndex, pageHits } = req.pagination

    const user = await User.findOne({ accessToken: accessToken });
    const userFavPosts = await UserPost.find({ savedFavBy: user._id })
      .skip(startIndex)
      .limit(pageHits);

    let filteredPosts = userFavPosts;

    if (location) {
      filteredPosts = filteredPosts.filter(post => post.location === location.toLowerCase());
    }

    if (filteredPosts.length) {
      res.status(200).json({
        success: true,
        response: filteredPosts
      })
    } else {
      res.status(404).json({
        success: false,
        response: "No favourites found"
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

// endpoint for deleting a post this can be done by the user who created it
router.delete("/surfposts/:surfPostId/delete", authenticateUser, async (req, res) => {
  const { surfPostId } = req.params;
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const itemToDelete = await UserPost.findOneAndDelete({ _id: surfPostId, createdBy: user._id });

    if (itemToDelete) {
      // went with 200 staus instead of 204, to be able to show the response text     
      res.status(200).json({
        success: true,
        response: "Item deleted succesfully"
      })
    } else {
      res.status(404).json({
        success: false,
        response: "Could not find post"
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    })
  }
});

// endpoint for updating a post this can be done by the user who created it
router.patch("/surfposts/:surfPostId/update", authenticateUser, async (req, res) => {
  const { surfPostId } = req.params;
  const accessToken = req.header("Authorization");
  const { message } = req.body;
  try {
    const user = await User.findOne({ accessToken: accessToken });
    const itemToUpdate = await UserPost.findOneAndUpdate(
      // first parameter to find correct post
      { _id: surfPostId, createdBy: user._id, },
      // second parameter with the properties to update
      { message },
      // third parameter for the option to return the updated object
      { new: true }
    );

    if (itemToUpdate) {
      res.status(200).json({
        success: true,
        response: itemToUpdate
      })
    } else {
      res.status(404).json({
        success: false,
        response: "Could not find post"
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    })
  }
});

export default router;