// models/userProfile.js
const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: String,
  username: String,
  bio: String,
  age: Number,
  profileimg: String,
  displayname: String,
  backgrund: String,
  facebookProfile: String,
  twitterProfile: String,
  tiktokProfile: String,
  telegramProfile: String,
  youtubeProfile: String,
  instagramProfile: String,
  discordProfile: String,
  password: String,
  passwords: String,


});

module.exports = mongoose.model('UserProfile', userProfileSchema);
