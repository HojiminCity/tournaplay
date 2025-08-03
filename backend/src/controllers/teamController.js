const Team = require('../models/Team');
const User = require('../models/User');
const Game = require('../models/Game');

// GET /api/teams - ดูทีมทั้งหมด
exports.getAllTeams = async (req, res) => {
  try {
    const { game, status, recruiting } = req.query;
    
    // สร้าง filter
    const filter = {};
    if (game) filter.gameId = game;
    if (status) filter.status = status;
    if (recruiting) filter['settings.isRecruiting'] = recruiting === 'true';

    const teams = await Team.find(filter)
      .populate('gameId', 'name genre')
      .populate('members.userId', 'displayName email photoURL')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// GET /api/teams/:id - ดูทีมเดียว
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('gameId', 'name genre imageUrl')
      .populate('members.userId', 'displayName email photoURL gameProfiles');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// POST /api/teams - สร้างทีมใหม่
exports.createTeam = async (req, res) => {
  try {
    const {
      name,
      tag,
      gameId,
      description,
      logo,
      contactInfo,
      captainId,
      maxMembers
    } = req.body;

    // ตรวจสอบว่า tag ซ้ำไหม
    if (tag) {
      const existingTeam = await Team.findOne({ tag: tag.toUpperCase() });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'Team tag already exists'
        });
      }
    }

    // ตรวจสอบว่า game มีอยู่จริงไหม
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // ตรวจสอบว่า captain มีอยู่จริงไหม
    const captain = await User.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        success: false,
        message: 'Captain not found'
      });
    }

    const team = new Team({
      name,
      tag: tag ? tag.toUpperCase() : undefined,
      gameId,
      description,
      logo,
      contactInfo,
      members: [{
        userId: captainId,
        role: 'captain',
        status: 'active'
      }],
      settings: {
        maxMembers: maxMembers || 5,
        isRecruiting: false,
        requireApproval: true
      }
    });

    await team.save();

    // Populate ข้อมูลก่อนส่งกลับ
    await team.populate('gameId', 'name genre');
    await team.populate('members.userId', 'displayName email photoURL');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create team',
      error: error.message
    });
  }
};

// PUT /api/teams/:id - อัพเดททีม
exports.updateTeam = async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'description', 'logo', 'contactInfo', 
      'status', 'settings'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('gameId', 'name genre')
    .populate('members.userId', 'displayName email photoURL');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update team',
      error: error.message
    });
  }
};

// DELETE /api/teams/:id - ลบทีม (Soft Delete)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { status: 'disbanded' },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      message: 'Team disbanded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disband team',
      error: error.message
    });
  }
};

// POST /api/teams/:id/members - เพิ่มสมาชิกใหม่
exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'player' } = req.body;
    
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // ตรวจสอบว่า user มีอยู่จริงไหม
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ใช้ method ของ model เพื่อเพิ่มสมาชิก
    team.addMember(userId, role);
    await team.save();

    // Populate ข้อมูลใหม่
    await team.populate('members.userId', 'displayName email photoURL');

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: team.members
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// DELETE /api/teams/:id/members/:userId - ลบสมาชิก
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // ใช้ method ของ model เพื่อลบสมาชิก
    team.removeMember(userId);
    await team.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// PUT /api/teams/:id/members/:userId - อัพเดทสมาชิก
exports.updateMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role, status } = req.body;
    
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const member = team.members.find(m => m.userId.toString() === userId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // อัพเดทข้อมูลสมาชิก
    if (role) member.role = role;
    if (status) member.status = status;

    await team.save();
    await team.populate('members.userId', 'displayName email photoURL');

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update member',
      error: error.message
    });
  }
};

// GET /api/teams/:id/members - ดูสมาชิกทั้งหมด
exports.getTeamMembers = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.userId', 'displayName email photoURL gameProfiles');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      teamName: team.name,
      count: team.members.length,
      data: team.members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};