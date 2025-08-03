const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Game = require('../models/Game');
const User = require('../models/User');

// GET /api/tournaments - ดูทัวร์นาเมนต์ทั้งหมด
exports.getAllTournaments = async (req, res) => {
  try {
    const { 
      game, 
      status, 
      type, 
      upcoming, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // สร้าง filter
    const filter = {};
    if (game) filter.gameId = game;
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    // Filter สำหรับทัวร์นาเมนต์ที่กำลังจะมาถึง
    if (upcoming === 'true') {
      filter.startDate = { $gte: new Date() };
    }
    
    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const tournaments = await Tournament.find(filter)
      .populate('gameId', 'name genre imageUrl')
      .populate('organizer', 'displayName email')
      .populate('registrations.teamId', 'name tag logo')
      .sort({ startDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tournament.countDocuments(filter);

    res.json({
      success: true,
      count: tournaments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: tournaments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// GET /api/tournaments/:id - ดูทัวร์นาเมนต์เดียว
exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('gameId', 'name genre imageUrl')
      .populate('organizer', 'displayName email photoURL')
      .populate('managers.userId', 'displayName email')
      .populate({
        path: 'registrations.teamId',
        select: 'name tag logo members stats',
        populate: {
          path: 'members.userId',
          select: 'displayName email photoURL'
        }
      })
      .populate('registrations.lineup.userId', 'displayName email photoURL')
      .populate('registrations.approvedBy', 'displayName email');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// POST /api/tournaments - สร้างทัวร์นาเมนต์ใหม่
exports.createTournament = async (req, res) => {
  try {
    const {
      name,
      description,
      gameId,
      type,
      format,
      registrationStart,
      registrationEnd,
      startDate,
      endDate,
      maxTeams,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      entryFee,
      prizePool,
      prizeDistribution,
      location,
      links,
      rules
    } = req.body;

    // ตรวจสอบว่าเกมมีอยู่จริงไหม
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // ตรวจสอบวันที่
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const tourStart = new Date(startDate);

    if (regStart >= regEnd) {
      return res.status(400).json({
        success: false,
        message: 'Registration end date must be after start date'
      });
    }

    if (regEnd >= tourStart) {
      return res.status(400).json({
        success: false,
        message: 'Tournament start date must be after registration end date'
      });
    }

    const tournament = new Tournament({
      name,
      description,
      gameId,
      organizer: req.user.userId,
      type,
      format,
      registrationStart: regStart,
      registrationEnd: regEnd,
      startDate: tourStart,
      endDate: endDate ? new Date(endDate) : undefined,
      maxTeams,
      minPlayersPerTeam: minPlayersPerTeam || 5,
      maxPlayersPerTeam: maxPlayersPerTeam || 5,
      entryFee: entryFee || 0,
      prizePool: prizePool || 0,
      prizeDistribution: prizeDistribution || [],
      location: location || {},
      links: links || {},
      rules,
      managers: [{
        userId: req.user.userId,
        role: 'organizer'
      }]
    });

    await tournament.save();

    // Populate ข้อมูลก่อนส่งกลับ
    await tournament.populate('gameId', 'name genre imageUrl');
    await tournament.populate('organizer', 'displayName email');

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create tournament',
      error: error.message
    });
  }
};

// PUT /api/tournaments/:id - อัพเดททัวร์นาเมนต์
exports.updateTournament = async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'description', 'registrationStart', 'registrationEnd', 
      'startDate', 'endDate', 'maxTeams', 'entryFee', 'prizePool', 
      'prizeDistribution', 'location', 'links', 'rules', 'status'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('gameId', 'name genre imageUrl')
    .populate('organizer', 'displayName email');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update tournament',
      error: error.message
    });
  }
};

// DELETE /api/tournaments/:id - ลบทัวร์นาเมนต์
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel tournament',
      error: error.message
    });
  }
};

// POST /api/tournaments/:id/register - ลงทะเบียนทีม
exports.registerTeam = async (req, res) => {
  try {
    const { teamId, lineup } = req.body;
    
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // ตรวจสอบว่าทีมมีอยู่จริงไหม
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
console.log('Current user ID:', req.user.userId);
console.log('Team captain check:', team.isCaptain(req.user.userId));
console.log('Team members:', team.members);
    // ตรวจสอบว่าผู้ใช้เป็น captain ของทีมไหม
    if (!team.isCaptain(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only team captain can register for tournaments'
      });
    }

    // ใช้ method ของ tournament model
    tournament.registerTeam(teamId, lineup);
    await tournament.save();

    // Populate ข้อมูลใหม่
    await tournament.populate('registrations.teamId', 'name tag logo');
    await tournament.populate('registrations.lineup.userId', 'displayName email');

    res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      data: tournament.registrations[tournament.registrations.length - 1]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// PUT /api/tournaments/:id/registrations/:teamId/approve - อนุมัติการลงทะเบียน
exports.approveRegistration = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // ใช้ method ของ tournament model
    tournament.approveRegistration(teamId, req.user.userId);
    await tournament.save();

    res.json({
      success: true,
      message: 'Registration approved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// PUT /api/tournaments/:id/registrations/:teamId/reject - ปฏิเสธการลงทะเบียน
exports.rejectRegistration = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const registration = tournament.registrations.find(reg => 
      reg.teamId.toString() === teamId
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'rejected';
    await tournament.save();

    res.json({
      success: true,
      message: 'Registration rejected successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to reject registration',
      error: error.message
    });
  }
};

// GET /api/tournaments/:id/registrations - ดูการลงทะเบียนทั้งหมด
exports.getTournamentRegistrations = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('registrations.teamId', 'name tag logo members stats')
      .populate('registrations.lineup.userId', 'displayName email photoURL')
      .populate('registrations.approvedBy', 'displayName email');
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      tournamentName: tournament.name,
      count: tournament.registrations.length,
      data: tournament.registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// PUT /api/tournaments/:id/status - เปลี่ยนสถานะทัวร์นาเมนต์
exports.updateTournamentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: `Tournament status updated to ${status}`,
      data: { status: tournament.status }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update tournament status',
      error: error.message
    });
  }
};