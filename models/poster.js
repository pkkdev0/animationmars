const mongoose = require('mongoose');

// Create Schema
const posterSchema = new mongoose.Schema({
  postId: String,
  username: String,
  biography: String,
  imgLink: String,
  star: String,
  time: String,
  triler: String,
  datatime: String,
  servervideo: String,
  servervideo2: String,
  servervideo3: String,
  servervideo4: String,
  servervideo5: String,
  servervideoname: String,
  servervideoname2: String,
  servervideoname3: String,
  servervideoname4: String,
  servervideoname5: String,
  userId: String,
  barg: [String],
  taknek: [String],
  warger: [String],
  tags: [String],
  viewsCount: {
    type: Number,
    default: 0,
  },
  userViews: {
    type: Map,
    of: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  // Add any other fields you might need for your poster content
});

// Create Model
const Poster = mongoose.model('Poster', posterSchema);

module.exports = Poster;
