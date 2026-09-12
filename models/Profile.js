const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  name: {
    type: String,
    default: 'Unknown Player'
  },
  avatar: {
    type: String,
    default: ''
  },
  games: [{
    title: String,
    addedAt: { type: Date, default: Date.now }
  }],
  ip: {
    type: String,
    default: null
  },
  settings: {
    ipLock: { type: Boolean, default: false },
    showOnLogin: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' }
  },
  bio: {
    age: { type: String, default: '' },
    favGame: { type: String, default: '' },
    discord: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Profile', profileSchema);
