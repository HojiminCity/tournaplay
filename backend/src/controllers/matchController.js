const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');

// GET /api/matches - ดูแมทช์ทั้งหมด
exports.getAllMatches = async (req, res) => {
  try {
    const { 
      tournament, 
      status, 
      round,
      team,
      page = 1, 
      limit = 20 
    } = req.query;
    
    // สร้าง filter
    const filter = {};
    if (tournament) filter.tournamentId = tournament;
    if (status) filter.status = status;
    if (round) filter.round = round;
    if (team) {
      filter.$or = [
        { team1: team },
        { team2: team }
      ];
    }

    const matches = await Match.find(filter)
      .populate('tournamentId', 'name status')
      .populate('team1', 'name tag logo')
      .populate('team2', 'name tag logo')
      .populate('winner', 'name tag')
      .populate('managedBy', 'displayName email')
      .sort({ scheduledTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Match.countDocuments(filter);

    res.json({
      success: true,
      count: matches.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// GET /api/matches/:id - ดูแมทช์เดียว
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournamentId', 'name type format rules')
      .populate('team1', 'name tag logo members')
      .populate('team2', 'name tag logo members')
      .populate('winner', 'name tag logo')
      .populate('managedBy', 'displayName email')
      .populate('evidences.uploadedBy', 'displayName email')
      .populate('gameScores.mvp', 'displayName email');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// POST /api/matches - สร้างแมทช์ใหม่
exports.createMatch = async (req, res) => {
  try {
    const {
      tournamentId,
      round,
      matchNumber,
      bracketPosition,
      team1,
      team2,
      scheduledTime,
      format,
      matchType
    } = req.body;

    // ตรวจสอบว่าทัวร์นาเมนต์มีอยู่จริงไหม
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // ตรวจสอบทีม (ถ้ามี)
    if (team1) {
      const teamOne = await Team.findById(team1);
      if (!teamOne) {
        return res.status(404).json({
          success: false,
          message: 'Team 1 not found'
        });
      }
    }

    if (team2) {
      const teamTwo = await Team.findById(team2);
      if (!teamTwo) {
        return res.status(404).json({
          success: false,
          message: 'Team 2 not found'
        });
      }
    }

    const match = new Match({
      tournamentId,
      round,
      matchNumber,
      bracketPosition,
      team1: team1 || null,
      team2: team2 || null,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      format: format || 'bo1',
      matchType: matchType || tournament.type,
      managedBy: req.user.userId,
      status: 'scheduled'
    });

    await match.save();

    // Populate ข้อมูลก่อนส่งกลับ
    await match.populate('tournamentId', 'name');
    await match.populate('team1', 'name tag logo');
    await match.populate('team2', 'name tag logo');

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: match
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create match',
      error: error.message
    });
  }
};

// PUT /api/matches/:id - อัพเดทแมทช์
exports.updateMatch = async (req, res) => {
  try {
    const allowedUpdates = [
      'scheduledTime', 'team1', 'team2', 'format', 'notes', 'streamInfo'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('tournamentId', 'name')
    .populate('team1', 'name tag logo')
    .populate('team2', 'name tag logo');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      message: 'Match updated successfully',
      data: match
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update match',
      error: error.message
    });
  }
};

// POST /api/matches/:id/checkin - Check-in ทีม
exports.checkInTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // ใช้ method ของ match model
    match.checkInTeam(teamId);
    await match.save();

    res.json({
      success: true,
      message: 'Team checked in successfully',
      data: {
        team1CheckedIn: match.checkIn.team1CheckedIn,
        team2CheckedIn: match.checkIn.team2CheckedIn,
        bothTeamsCheckedIn: match.bothTeamsCheckedIn
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// POST /api/matches/:id/start - เริ่มแมทช์
exports.startMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // ใช้ method ของ match model
    match.startMatch();
    await match.save();

    res.json({
      success: true,
      message: 'Match started successfully',
      data: {
        status: match.status,
        startTime: match.startTime
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// POST /api/matches/:id/finish - จบแมทช์
exports.finishMatch = async (req, res) => {
  try {
    const { winnerId, team1Score, team2Score } = req.body;
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // ตรวจสอบว่า winnerId เป็นทีมที่แข่งจริงไหม
    if (winnerId && 
        winnerId !== match.team1?.toString() && 
        winnerId !== match.team2?.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Winner must be one of the participating teams'
      });
    }

    // ใช้ method ของ match model
    match.setWinner(winnerId, team1Score, team2Score);
    await match.save();

    // อัพเดทสถิติทีม
    if (winnerId) {
      await Team.findByIdAndUpdate(winnerId, { $inc: { 'stats.wins': 1 } });
      
      const loserId = winnerId === match.team1?.toString() ? match.team2 : match.team1;
      if (loserId) {
        await Team.findByIdAndUpdate(loserId, { $inc: { 'stats.losses': 1 } });
      }
    }

    await match.populate('winner', 'name tag logo');

    res.json({
      success: true,
      message: 'Match finished successfully',
      data: {
        status: match.status,
        winner: match.winner,
        team1Score: match.team1Score,
        team2Score: match.team2Score,
        endTime: match.endTime
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to finish match',
      error: error.message
    });
  }
};

// POST /api/matches/:id/game-score - เพิ่มผลเกม (สำหรับ Best of 3/5)
exports.addGameScore = async (req, res) => {
  try {
    const { gameNumber, team1Score, team2Score, winnerId, mvp, duration } = req.body;
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // ตรวจสอบว่า winnerId เป็นทีมที่แข่งจริงไหม
    if (winnerId !== match.team1?.toString() && winnerId !== match.team2?.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Winner must be one of the participating teams'
      });
    }

    // ใช้ method ของ match model
    match.addGameScore(gameNumber, team1Score, team2Score, winnerId);
    
    // เพิ่มข้อมูลเพิ่มเติม
    const gameScore = match.gameScores[match.gameScores.length - 1];
    if (mvp) gameScore.mvp = mvp;
    if (duration) gameScore.duration = duration;
    
    await match.save();

    res.json({
      success: true,
      message: 'Game score added successfully',
      data: {
        gameScore,
        matchStatus: match.status,
        isMatchCompleted: match.status === 'completed'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add game score',
      error: error.message
    });
  }
};

// POST /api/matches/:id/evidence - เพิ่มหลักฐาน
exports.addEvidence = async (req, res) => {
  try {
    const { type, url, description, teamId } = req.body;
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const evidence = {
      uploadedBy: req.user.userId,
      teamId: teamId || null,
      type,
      url,
      description
    };

    match.evidences.push(evidence);
    await match.save();

    await match.populate('evidences.uploadedBy', 'displayName email');

    res.status(201).json({
      success: true,
      message: 'Evidence added successfully',
      data: evidence
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add evidence',
      error: error.message
    });
  }
};

// GET /api/tournaments/:id/matches - ดูแมทช์ของทัวร์นาเมนต์
exports.getTournamentMatches = async (req, res) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.id })
      .populate('team1', 'name tag logo')
      .populate('team2', 'name tag logo')
      .populate('winner', 'name tag logo')
      .sort({ matchNumber: 1, scheduledTime: 1 });

    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};