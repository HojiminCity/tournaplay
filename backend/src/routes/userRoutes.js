const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - ดูผู้ใช้ทั้งหมด
router.get('/', userController.getAllUsers);

// GET /api/users/:id - ดูผู้ใช้คนเดียว
router.get('/:id', userController.getUserById);

// POST /api/users - สร้างผู้ใช้ใหม่
router.post('/', userController.createUser);

// PUT /api/users/:id - อัพเดทผู้ใช้
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - ลบผู้ใช้
router.delete('/:id', userController.deleteUser);

module.exports = router;