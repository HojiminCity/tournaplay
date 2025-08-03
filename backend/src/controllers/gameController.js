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

// POST /api/games/:gameId/heroes/:heroId/skills - เพิ่ม Skill ให้ Hero
exports.addSkill = async (req, res) => {
  try {
    const { gameId, heroId } = req.params;
    const { name, description, imageUrl } = req.body;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const hero = game.heroes.id(heroId);
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero not found'
      });
    }

    // ตรวจสอบว่า skill ซ้ำไหม
    const existingSkill = hero.skills.find(skill => skill.name === name);
    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'Skill already exists for this hero'
      });
    }

    const newSkill = {
      name,
      description,
      imageUrl
    };

    hero.skills.push(newSkill);
    await game.save();

    res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      data: newSkill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add skill',
      error: error.message
    });
  }
};

// GET /api/games/:gameId/heroes/:heroId/skills - ดู Skills ของ Hero
exports.getHeroSkills = async (req, res) => {
  try {
    const { gameId, heroId } = req.params;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const hero = game.heroes.id(heroId);
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero not found'
      });
    }

    res.json({
      success: true,
      heroName: hero.name,
      count: hero.skills.length,
      data: hero.skills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// PUT /api/games/:gameId/heroes/:heroId/skills/:skillId - แก้ไข Skill
exports.updateSkill = async (req, res) => {
  try {
    const { gameId, heroId, skillId } = req.params;
    const { name, description, imageUrl } = req.body;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const hero = game.heroes.id(heroId);
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero not found'
      });
    }

    const skill = hero.skills.id(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // อัพเดท skill
    if (name) skill.name = name;
    if (description) skill.description = description;
    if (imageUrl !== undefined) skill.imageUrl = imageUrl;

    await game.save();

    res.json({
      success: true,
      message: 'Skill updated successfully',
      data: skill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update skill',
      error: error.message
    });
  }
};

// DELETE /api/games/:gameId/heroes/:heroId/skills/:skillId - ลบ Skill
exports.deleteSkill = async (req, res) => {
  try {
    const { gameId, heroId, skillId } = req.params;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const hero = game.heroes.id(heroId);
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero not found'
      });
    }

    const skill = hero.skills.id(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    hero.skills.pull(skillId);
    await game.save();

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete skill',
      error: error.message
    });
  }
};