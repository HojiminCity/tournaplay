const Game = require('../models/Game');

// GET /api/games - ดูเกมทั้งหมด
exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true });
    res.json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// GET /api/games/:id - ดูเกมเดียว
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// POST /api/games - สร้างเกมใหม่
exports.createGame = async (req, res) => {
  try {
    const { name, genre, description, imageUrl } = req.body;

    // ตรวจสอบว่าเกมซ้ำไหม
    const existingGame = await Game.findOne({ name });
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: 'Game already exists'
      });
    }

    const game = new Game({
      name,
      genre,
      description,
      imageUrl,
      heroes: [] // เริ่มต้นไม่มี heroes
    });

    await game.save();

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: game
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create game',
      error: error.message
    });
  }
};

// PUT /api/games/:id - อัพเดทเกม
exports.updateGame = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'genre', 'description', 'imageUrl', 'isActive'];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const game = await Game.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: game
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update game',
      error: error.message
    });
  }
};

// DELETE /api/games/:id - ลบเกม (Soft Delete)
exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete game',
      error: error.message
    });
  }
};

// POST /api/games/:id/heroes - เพิ่ม Hero ให้เกม
exports.addHero = async (req, res) => {
  try {
    const { name, role, description, imageUrl } = req.body;
    
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // ตรวจสอบว่า hero ซ้ำไหม
    const existingHero = game.heroes.find(hero => hero.name === name);
    if (existingHero) {
      return res.status(400).json({
        success: false,
        message: 'Hero already exists in this game'
      });
    }

    const newHero = {
      name,
      role,
      description,
      imageUrl,
      skills: []
    };

    game.heroes.push(newHero);
    await game.save();

    res.status(201).json({
      success: true,
      message: 'Hero added successfully',
      data: newHero
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add hero',
      error: error.message
    });
  }
};

// GET /api/games/:id/heroes - ดู Heroes ของเกม
exports.getGameHeroes = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      count: game.heroes.length,
      data: game.heroes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};