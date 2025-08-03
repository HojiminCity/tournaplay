const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const matchController = require('../controllers/matchController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public Routes (ไม่ต้อง login)
router.get('/', tournamentController.getAllTournaments);           // GET /api/tournaments
router.get('/:id', tournamentController.getTournamentById);        // GET /api/tournaments/:id
router.get('/:id/registrations', tournamentController.getTournamentRegistrations); // GET /api/tournaments/:id/registrations
router.get('/:id/matches', matchController.getTournamentMatches);  // GET /api/tournaments/:id/matches

// Protected Routes (ต้อง login)
router.post('/', authenticate, tournamentController.createTournament);           // POST /api/tournaments
router.put('/:id', authenticate, tournamentController.updateTournament);         // PUT /api/tournaments/:id
router.delete('/:id', authenticate, tournamentController.deleteTournament);      // DELETE /api/tournaments/:id

// Team Registration Routes (ต้อง login)
router.post('/:id/register', authenticate, tournamentController.registerTeam);   // POST /api/tournaments/:id/register

// Manager/Admin Routes (ต้องเป็น manager หรือ admin)
router.put('/:id/registrations/:teamId/approve', 
  authenticate, 
  authorize('manager', 'admin'), 
  tournamentController.approveRegistration
); // PUT /api/tournaments/:id/registrations/:teamId/approve

router.put('/:id/registrations/:teamId/reject', 
  authenticate, 
  authorize('manager', 'admin'), 
  tournamentController.rejectRegistration
); // PUT /api/tournaments/:id/registrations/:teamId/reject

router.put('/:id/status', 
  authenticate, 
  authorize('manager', 'admin'), 
  tournamentController.updateTournamentStatus
); // PUT /api/tournaments/:id/status

module.exports = router;