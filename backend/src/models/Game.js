const mongoose = require('mongoose');

// Schema สำหรับ Skills ของ Hero
const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['passive', 'active'],
    default: 'active'
  },
  description: {
    type: String,
    trim: true
  },
  cooldown: {
    type: String,
    trim: true // เช่น "8s", "12s", "Passive"
  },
  manaCost: {
    type: String,
    trim: true // เช่น "50 MP", "80 MP"
  },
  imageUrl: {
    type: String,
    default: null
  }
}, { _id: true });

// Schema สำหรับ Heroes/Characters
const heroSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    trim: true // เช่น "Mage", "Assassin", "Support", "Tank", "Marksman"
  },
  imageUrl: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  skills: [skillSchema] // Array ของ skills
}, { 
  _id: true,
  timestamps: true 
});

// Schema หลักสำหรับ Game
const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true // เช่น "ROV", "Valorant", "Mobile Legends"
  },
  genre: {
    type: String,
    trim: true // เช่น "MOBA", "FPS", "Battle Royale"
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Heroes/Characters ของเกมนั้นๆ
  heroes: [heroSchema]
}, {
  timestamps: true
});

// Index สำหรับการค้นหา
gameSchema.index({ name: 1 });
gameSchema.index({ genre: 1 });
gameSchema.index({ isActive: 1 });

// Index สำหรับ Heroes
gameSchema.index({ 'heroes.name': 1 });
gameSchema.index({ 'heroes.role': 1 });

module.exports = mongoose.model('Game', gameSchema);