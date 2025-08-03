const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// Team CRUD Routes
router.get('/', teamController.getAllTeams);           // GET /api/teams
router.get('/:id', teamController.getTeamById);        // GET /api/teams/:id
router.post('/', teamController.createTeam);           // POST /api/teams
router.put('/:id', teamController.updateTeam);         // PUT /api/teams/:id
router.delete('/:id', teamController.deleteTeam);      // DELETE /api/teams/:id

// Team Members Routes
router.get('/:id/members', teamController.getTeamMembers);           // GET /api/teams/:id/members
router.post('/:id/members', teamController.addMember);               // POST /api/teams/:id/members
router.put('/:id/members/:userId', teamController.updateMember);     // PUT /api/teams/:id/members/:userId
router.delete('/:id/members/:userId', teamController.removeMember);  // DELETE /api/teams/:id/members/:userId

module.exports = router;