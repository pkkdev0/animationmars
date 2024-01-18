// models/user.js (if you have not already created the model)
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  username: String,
  bio: String,
  age: Number,
});

module.exports = mongoose.model("User", userSchema);
