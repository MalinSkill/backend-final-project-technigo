import mongoose from "mongoose";

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
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  }
});

const UserPost = mongoose.model("Userpost", userPostSchema);

export default UserPost;