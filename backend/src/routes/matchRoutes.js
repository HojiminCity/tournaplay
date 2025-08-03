const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public Routes (ไม่ต้อง login)
router.get('/', matchController.getAllMatches);              // GET /api/matches
router.get('/:id', matchController.getMatchById);           // GET /api/matches/:id

// Manager/Admin Routes (สร้างและจัดการแมทช์)
router.post('/', 
  authenticate, 
  authorize('manager', 'admin'), 
  matchController.createMatch
); // POST /api/matches

router.put('/:id', 
  authenticate, 
  authorize('manager', 'admin'), 
  matchController.updateMatch
); // PUT /api/matches/:id

// Match Management Routes (ต้อง login)
router.post('/:id/checkin', authenticate, matchController.checkInTeam);     // POST /api/matches/:id/checkin

// Manager/Admin Match Control
router.post('/:id/start', 
  authenticate, 
  authorize('manager', 'admin'), 
  matchController.startMatch
); // POST /api/matches/:id/start

router.post('/:id/finish', 
  authenticate, 
  authorize('manager', 'admin'), 
  matchController.finishMatch
); // POST /api/matches/:id/finish

router.post('/:id/game-score', 
  authenticate, 
  authorize('manager', 'admin'), 
  matchController.addGameScore
); // POST /api/matches/:id/game-score

// Evidence Routes (ต้อง login)
router.post('/:id/evidence', authenticate, matchController.addEvidence);    // POST /api/matches/:id/evidence

module.exports = router;