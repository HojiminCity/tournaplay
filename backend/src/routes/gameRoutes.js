const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Game CRUD Routes
router.get('/', gameController.getAllGames);           // GET /api/games
router.get('/:id', gameController.getGameById);        // GET /api/games/:id
router.post('/', gameController.createGame);           // POST /api/games
router.put('/:id', gameController.updateGame);         // PUT /api/games/:id
router.delete('/:id', gameController.deleteGame);      // DELETE /api/games/:id

// Hero Routes
router.get('/:id/heroes', gameController.getGameHeroes); // GET /api/games/:id/heroes
router.post('/:id/heroes', gameController.addHero);      // POST /api/games/:id/heroes

module.exports = router;