const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware สำหรับตรวจสอบ JWT Token
exports.authenticate = async (req, res, next) => {
  try {
    // ดึง token จาก header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // ตรวจสอบรูปแบบ token (Bearer <token>)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // หาผู้ใช้จาก database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    // ตรวจสอบสถานะผู้ใช้
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned.'
      });
    }

    // เพิ่มข้อมูลผู้ใช้ลง req object
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      displayName: user.displayName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};

// Middleware สำหรับตรวจสอบ role ผู้ใช้
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware สำหรับ optional authentication (ไม่บังคับต้อง login)
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next(); // ไม่มี token ก็ผ่าน
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return next(); // ไม่มี token ก็ผ่าน
    }

    // ถ้ามี token ก็ตรวจสอบ
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.status === 'active') {
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        displayName: user.displayName
      };
    }

    next();
  } catch (error) {
    // ถ้า token ผิด ก็ไม่ต้องใส่ user แต่ยังผ่านได้
    next();
  }
};

// Middleware สำหรับตรวจสอบว่าเป็นเจ้าของ resource หรือ admin
exports.resourceOwner = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admin ผ่านได้เสมอ
    if (req.user.role === 'admin') {
      return next();
    }

    // ดึง userId จาก params หรือ body
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.userId.toString() !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};