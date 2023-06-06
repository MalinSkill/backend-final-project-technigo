import express from "express";
const router = express.Router()
import mongoose from "mongoose";
import User from '../Models/user';
import bcrypt from "bcrypt";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Registration route
router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  // Perform email validation  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      response: 'Invalid email address'
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
router.post("/login", async (req, res) => {
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

export default router;