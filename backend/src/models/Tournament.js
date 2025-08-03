const mongoose = require('mongoose');

// Schema สำหรับ Team Registration
const registrationSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lineup: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['captain', 'player', 'substitute'],
      required: true
    }
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, { _id: true });

// Schema หลักสำหรับ Tournament
const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ประเภททัวร์นาเมนต์
  type: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    required: true
  },
  format: {
    type: String,
    enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss'],
    default: 'single_elimination'
  },

  // วันเวลา
  registrationStart: {
    type: Date,
    required: true
  },
  registrationEnd: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },

  // การตั้งค่าทัวร์นาเมนต์
  maxTeams: {
    type: Number,
    required: true,
    min: 2,
    max: 128
  },
  minPlayersPerTeam: {
    type: Number,
    default: 5,
    min: 1
  },
  maxPlayersPerTeam: {
    type: Number,
    default: 5,
    min: 1
  },
  entryFee: {
    type: Number,
    default: 0,
    min: 0
  },

  // รางวัล
  prizePool: {
    type: Number,
    default: 0,
    min: 0
  },
  prizeDistribution: [{
    position: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],

  // สถานที่ (สำหรับ offline)
  location: {
    venue: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },

  // ลิงก์และข้อมูลออนไลน์
  links: {
    stream: {
      type: String,
      trim: true
    },
    discord: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },

  // กฎและข้อบังคับ
  rules: {
    type: String,
    trim: true
  },
  
  // สถานะ
  status: {
    type: String,
    enum: ['draft', 'open', 'registration_closed', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },

  // การลงทะเบียน
  registrations: [registrationSchema],

  // ผู้จัดการทัวร์นาเมนต์
  managers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['organizer', 'manager', 'moderator'],
      default: 'manager'
    }
  }],

  // สถิติ
  stats: {
    totalRegistrations: {
      type: Number,
      default: 0
    },
    approvedTeams: {
      type: Number,
      default: 0
    },
    totalMatches: {
      type: Number,
      default: 0
    },
    completedMatches: {
      type: Number,
      default: 0
    }
  },

  // การตั้งค่าเพิ่มเติม
  settings: {
    autoApproveRegistrations: {
      type: Boolean,
      default: false
    },
    allowSubstitutes: {
      type: Boolean,
      default: true
    },
    requireCheckIn: {
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
tournamentSchema.index({ name: 1 });
tournamentSchema.index({ gameId: 1 });
tournamentSchema.index({ organizer: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ type: 1 });
tournamentSchema.index({ registrationStart: 1, registrationEnd: 1 });
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ 'registrations.teamId': 1 });

// Virtual สำหรับตรวจสอบว่าเปิดรับสมัครไหม
tournamentSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return this.status === 'open' && 
         now >= this.registrationStart && 
         now <= this.registrationEnd &&
         this.stats.approvedTeams < this.maxTeams;
});

// Virtual สำหรับนับทีมที่รอการอนุมัติ
tournamentSchema.virtual('pendingRegistrationsCount').get(function() {
  return this.registrations.filter(reg => reg.status === 'pending').length;
});

// Method สำหรับเช็คว่าทีมลงทะเบียนแล้วไหม
tournamentSchema.methods.isTeamRegistered = function(teamId) {
  return this.registrations.some(reg => 
    reg.teamId.toString() === teamId.toString()
  );
};

// Method สำหรับเช็คว่าทีมได้รับการอนุมัติไหม
tournamentSchema.methods.isTeamApproved = function(teamId) {
  return this.registrations.some(reg => 
    reg.teamId.toString() === teamId.toString() && 
    reg.status === 'approved'
  );
};

// Method สำหรับลงทะเบียนทีม
tournamentSchema.methods.registerTeam = function(teamId, lineup) {
  // เช็คว่าลงทะเบียนแล้วไหม
  if (this.isTeamRegistered(teamId)) {
    throw new Error('Team is already registered for this tournament');
  }

  // เช็คว่าเปิดรับสมัครไหม
  if (!this.isRegistrationOpen) {
    throw new Error('Registration is not open for this tournament');
  }

  // เช็คว่าทีมเต็มไหม
  if (this.stats.approvedTeams >= this.maxTeams) {
    throw new Error('Tournament is full');
  }

  const newRegistration = {
    teamId,
    lineup,
    status: this.settings.autoApproveRegistrations ? 'approved' : 'pending'
  };

  this.registrations.push(newRegistration);
  this.stats.totalRegistrations += 1;

  if (newRegistration.status === 'approved') {
    this.stats.approvedTeams += 1;
  }
};

// Method สำหรับอนุมัติการลงทะเบียน
tournamentSchema.methods.approveRegistration = function(teamId, approverId) {
  const registration = this.registrations.find(reg => 
    reg.teamId.toString() === teamId.toString()
  );

  if (!registration) {
    throw new Error('Registration not found');
  }

  if (registration.status === 'approved') {
    throw new Error('Registration is already approved');
  }

  registration.status = 'approved';
  registration.approvedBy = approverId;
  registration.approvedAt = new Date();
  this.stats.approvedTeams += 1;
};

module.exports = mongoose.model('Tournament', tournamentSchema);