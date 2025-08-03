const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ข้อมูลพื้นฐาน
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  firstname: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lastname: {
    type: String,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  photoURL: {
    type: String,
    default: null
  },

  // ที่อยู่
  address: {
    type: String,
    trim: true
  },
  subDistrict: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },

  // บทบาทและสถานะ
  role: {
    type: String,
    enum: ['user', 'captain', 'manager', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'banned'],
    default: 'active'
  },

  // Game Profiles - เก็บข้อมูลเกมที่เล่น
  gameProfiles: [{
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    inGameName: {
      type: String,
      trim: true
    },
    mainRole: {
      type: String,
      trim: true
    },
    rank: {
      type: String,
      trim: true
    },
    favCharacters: [String]
  }],

  // เวลา
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // จะสร้าง createdAt และ updatedAt อัตโนมัติ
});

// Hash password ก่อนบันทึก
userSchema.pre('save', async function(next) {
  // ถ้า password ไม่ได้เปลี่ยน ไม่ต้อง hash ใหม่
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method สำหรับเปรียบเทียบ password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index สำหรับการค้นหา
userSchema.index({ email: 1 });
userSchema.index({ displayName: 1 });
userSchema.index({ role: 1 });

// Virtual สำหรับ fullName
userSchema.virtual('fullName').get(function() {
  if (this.firstname && this.lastname) {
    return `${this.firstname} ${this.lastname}`;
  }
  return this.displayName;
});

// Method สำหรับซ่อน password เวลา return JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);