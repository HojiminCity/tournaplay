const mongoose = require('mongoose');

// Schema สำหรับสมาชิกในทีม
const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['captain', 'player', 'substitute'],
    default: 'player'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Schema หลักสำหรับ Team
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  tag: {
    type: String,
    unique: true,
    trim: true,
    maxlength: 20,
    uppercase: true // จะแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ
  },
  logo: {
    type: String,
    default: null
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'disbanded', 'recruiting'],
    default: 'active'
  },
  
  // ข้อมูลการติดต่อ
  contactInfo: {
    discord: {
      type: String,
      trim: true
    },
    facebook: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },

  // สมาชิกในทีม
  members: [teamMemberSchema],

  // สถิติทีม
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    tournamentsJoined: {
      type: Number,
      default: 0
    },
    tournamentsWon: {
      type: Number,
      default: 0
    }
  },

  // การตั้งค่าทีม
  settings: {
    isRecruiting: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    requireApproval: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index สำหรับการค้นหา
teamSchema.index({ name: 1 });
teamSchema.index({ tag: 1 });
teamSchema.index({ gameId: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ 'settings.isRecruiting': 1 });

// Virtual สำหรับหา Captain
teamSchema.virtual('captain').get(function() {
  return this.members.find(member => member.role === 'captain');
});

// Virtual สำหรับนับสมาชิกที่ active
teamSchema.virtual('activeMembersCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual สำหรับ win rate
teamSchema.virtual('winRate').get(function() {
  const totalGames = this.stats.wins + this.stats.losses;
  if (totalGames === 0) return 0;
  return Math.round((this.stats.wins / totalGames) * 100);
});

// Method สำหรับเช็คว่า user เป็นสมาชิกไหม
teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.userId.toString() === userId.toString() && 
    member.status === 'active'
  );
};

// Method สำหรับเช็คว่า user เป็น captain ไหม
teamSchema.methods.isCaptain = function(userId) {
  const captain = this.members.find(member => member.role === 'captain');
  return captain && captain.userId.toString() === userId.toString();
};

// Method สำหรับเพิ่มสมาชิก
teamSchema.methods.addMember = function(userId, role = 'player') {
  // เช็คว่าเป็นสมาชิกอยู่แล้วไหม
  if (this.isMember(userId)) {
    throw new Error('User is already a member of this team');
  }

  // เช็คว่าทีมเต็มไหม
  if (this.activeMembersCount >= this.settings.maxMembers) {
    throw new Error('Team is full');
  }

  // เช็คว่ามี captain แล้วไหม ถ้าจะเพิ่มเป็น captain
  if (role === 'captain' && this.captain) {
    throw new Error('Team already has a captain');
  }

  this.members.push({
    userId,
    role,
    status: this.settings.requireApproval ? 'pending' : 'active'
  });
};

// Method สำหรับลบสมาชิก
teamSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this team');
  }

  this.members.splice(memberIndex, 1);
};

module.exports = mongoose.model('Team', teamSchema);