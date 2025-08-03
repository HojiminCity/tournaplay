const User = require('../models/User');
const jwt = require('jsonwebtoken');

// สร้าง JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token หมดอายุใน 7 วัน
  });
};

// POST /api/auth/register - สมัครสมาชิก
exports.register = async (req, res) => {
  try {
    const {
      displayName,
      email,
      password,
      firstname,
      lastname,
      phoneNumber
    } = req.body;

    // ตรวจสอบข้อมูลจำเป็น
    if (!displayName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Display name, email, and password are required'
      });
    }

    // ตรวจสอบรูปแบบ email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // ตรวจสอบความยาว password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // ตรวจสอบว่า email ซ้ำไหม
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // สร้างผู้ใช้ใหม่
    const user = new User({
      displayName,
      email,
      password, // จะถูก hash อัตโนมัติใน User model
      firstname,
      lastname,
      phoneNumber
    });

    await user.save();

    // สร้าง token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// POST /api/auth/login - เข้าสู่ระบบ
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบข้อมูลจำเป็น
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // หาผู้ใช้จาก email (ต้องเอา password มาด้วย)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ตรวจสอบสถานะผู้ใช้
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned'
      });
    }

    // ตรวจสอบ password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // อัพเดท lastLogin
    user.lastLogin = new Date();
    await user.save();

    // สร้าง token
    const token = generateToken(user._id);

    // ลบ password ออกจาก response
    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// GET /api/auth/me - ดูข้อมูลผู้ใช้ปัจจุบัน
exports.getMe = async (req, res) => {
  try {
    // req.user จะมาจาก auth middleware
    const user = await User.findById(req.user.userId)
      .populate('gameProfiles.gameId', 'name genre imageUrl');

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
      message: 'Failed to get user data',
      error: error.message
    });
  }
};

// PUT /api/auth/profile - อัพเดทข้อมูลส่วนตัว
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'displayName', 'firstname', 'lastname', 'phoneNumber',
      'address', 'subDistrict', 'district', 'province', 'postalCode',
      'photoURL'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// PUT /api/auth/change-password - เปลี่ยนรหัสผ่าน
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // ตรวจสอบข้อมูลจำเป็น
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // ตรวจสอบความยาว password ใหม่
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // หาผู้ใช้พร้อม password
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ตรวจสอบ password เดิม
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // อัพเดท password ใหม่
    user.password = newPassword;
    await user.save(); // จะ hash อัตโนมัติ

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// POST /api/auth/logout - ออกจากระบบ
exports.logout = async (req, res) => {
  // ใน JWT ไม่สามารถ invalidate token ได้
  // แต่สามารถบอกให้ client ลบ token ออก
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client.'
  });
};