const mongoose = require('mongoose');

// Schema สำหรับ Game Score (แต่ละเกม)
const gameScoreSchema = new mongoose.Schema({
  gameNumber: {
    type: Number,
    required: true
  },
  team1Score: {
    type: Number,
    default: 0
  },
  team2Score: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  duration: {
    type: Number // ระยะเวลาเป็นนาที
  },
  mvp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

// Schema สำหรับหลักฐานการแข่ง
const evidenceSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Schema หลักสำหรับ Match
const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  
  // ข้อมูลการแข่งขัน
  round: {
    type: String,
    required: true // เช่น "Round 1", "Quarterfinal", "Semifinal", "Final"
  },
  matchNumber: {
    type: Number,
    required: true
  },
  bracketPosition: {
    type: String,
    required: true // เช่น "WB1", "LB1", "GF" (Winners Bracket, Losers Bracket, Grand Final)
  },

  // ทีมที่แข่ง
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },

  // ผลการแข่งขัน
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  team1Score: {
    type: Number,
    default: 0
  },
  team2Score: {
    type: Number,
    default: 0
  },

  // รายละเอียดแต่ละเกม (สำหรับ Best of 3, Best of 5)
  gameScores: [gameScoreSchema],
  
  // การตั้งค่าการแข่ง
  format: {
    type: String,
    enum: ['bo1', 'bo3', 'bo5'], // Best of 1, 3, 5
    default: 'bo1'
  },
  
  // เวลา
  scheduledTime: {
    type: Date
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  
  // สถานะ
  status: {
    type: String,
    enum: ['scheduled', 'ready', 'live', 'completed', 'walkover', 'cancelled', 'disputed'],
    default: 'scheduled'
  },

  // ประเภทการแข่ง
  matchType: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },

  // ผู้จัดการแมทช์
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // หลักฐานการแข่ง
  evidences: [evidenceSchema],

  // ข้อมูลการ Stream
  streamInfo: {
    streamUrl: {
      type: String,
      trim: true
    },
    streamer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isLive: {
      type: Boolean,
      default: false
    }
  },

  // ข้อมูลสำหรับ Bracket
  nextMatch: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    },
    loser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    }
  },
  previousMatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],

  // ข้อมูล Bye (ไม่ต้องแข่ง)
  isBye: {
    type: Boolean,
    default: false
  },

  // หมายเหตุ
  notes: {
    type: String,
    trim: true
  },

  // ข้อมูลการ Check-in
  checkIn: {
    team1CheckedIn: {
      type: Boolean,
      default: false
    },
    team2CheckedIn: {
      type: Boolean,
      default: false
    },
    checkInDeadline: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index สำหรับการค้นหา
matchSchema.index({ tournamentId: 1 });
matchSchema.index({ round: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ scheduledTime: 1 });
matchSchema.index({ team1: 1, team2: 1 });
matchSchema.index({ bracketPosition: 1 });

// Virtual สำหรับตรวจสอบว่าทั้งสองทีม check-in แล้วไหม
matchSchema.virtual('bothTeamsCheckedIn').get(function() {
  return this.checkIn.team1CheckedIn && this.checkIn.team2CheckedIn;
});

// Virtual สำหรับระยะเวลาการแข่ง
matchSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // นาที
  }
  return null;
});

// Method สำหรับกำหนดผู้ชนะ
matchSchema.methods.setWinner = function(winnerId, score1, score2) {
  this.winner = winnerId;
  this.team1Score = score1;
  this.team2Score = score2;
  this.status = 'completed';
  this.endTime = new Date();
};

// Method สำหรับ check-in ทีม
matchSchema.methods.checkInTeam = function(teamId) {
  if (this.team1 && this.team1.toString() === teamId.toString()) {
    this.checkIn.team1CheckedIn = true;
  } else if (this.team2 && this.team2.toString() === teamId.toString()) {
    this.checkIn.team2CheckedIn = true;
  } else {
    throw new Error('Team is not part of this match');
  }
};

// Method สำหรับเริ่มแมทช์
matchSchema.methods.startMatch = function() {
  if (!this.bothTeamsCheckedIn) {
    throw new Error('Both teams must check in before starting the match');
  }
  
  this.status = 'live';
  this.startTime = new Date();
};

// Method สำหรับเพิ่มผลเกม (สำหรับ Best of 3/5)
matchSchema.methods.addGameScore = function(gameNumber, team1Score, team2Score, winnerId) {
  const gameScore = {
    gameNumber,
    team1Score,
    team2Score,
    winner: winnerId
  };
  
  this.gameScores.push(gameScore);
  
  // ตรวจสอบว่าจบแมทช์แล้วไหม
  this.checkMatchCompletion();
};

// Method สำหรับตรวจสอบว่าแมทช์จบแล้วไหม
matchSchema.methods.checkMatchCompletion = function() {
  const format = this.format;
  const requiredWins = format === 'bo1' ? 1 : format === 'bo3' ? 2 : 3;
  
  const team1Wins = this.gameScores.filter(game => 
    game.winner && game.winner.toString() === this.team1.toString()
  ).length;
  
  const team2Wins = this.gameScores.filter(game => 
    game.winner && game.winner.toString() === this.team2.toString()
  ).length;
  
  if (team1Wins >= requiredWins) {
    this.setWinner(this.team1, team1Wins, team2Wins);
  } else if (team2Wins >= requiredWins) {
    this.setWinner(this.team2, team1Wins, team2Wins);
  }
};

module.exports = mongoose.model('Match', matchSchema);