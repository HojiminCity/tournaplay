const User = require('../models/User');

// GET /api/users - ดูผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// GET /api/users/:id - ดูผู้ใช้คนเดียว
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// POST /api/users - สร้างผู้ใช้ใหม่
exports.createUser = async (req, res) => {
  try {
    const {
      displayName,
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      address,
      subDistrict,
      district,
      province,
      postalCode,
      role
    } = req.body;

    // ตรวจสอบว่า email ซ้ำไหม
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const user = new User({
      displayName,
      firstname,
      lastname,
      email,
      password, // ในระบบจริงต้อง hash password ก่อน
      phoneNumber,
      address,
      subDistrict,
      district,
      province,
      postalCode,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// PUT /api/users/:id - อัพเดทผู้ใช้
exports.updateUser = async (req, res) => {
  try {
    const allowedUpdates = [
      'displayName', 'firstname', 'lastname', 'phoneNumber',
      'address', 'subDistrict', 'district', 'province', 'postalCode',
      'photoURL', 'role', 'status'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// DELETE /api/users/:id - ลบผู้ใช้
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};