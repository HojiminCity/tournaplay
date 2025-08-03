const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public Routes (ไม่ต้อง login)
router.post('/register', authController.register);    // POST /api/auth/register
router.post('/login', authController.login);          // POST /api/auth/login

// Protected Routes (ต้อง login)
router.get('/me', authenticate, authController.getMe);                        // GET /api/auth/me
router.put('/profile', authenticate, authController.updateProfile);           // PUT /api/auth/profile
router.put('/change-password', authenticate, authController.changePassword);  // PUT /api/auth/change-password
router.post('/logout', authenticate, authController.logout);                  // POST /api/auth/logout

module.exports = router;