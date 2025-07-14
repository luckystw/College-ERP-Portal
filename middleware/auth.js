const jwt = require('jsonwebtoken');
const User = require('../models/User');
const securityConfig = require('../config/security');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify token with security config
        const decoded = jwt.verify(token, securityConfig.jwt.secret, {
            issuer: securityConfig.jwt.issuer,
            audience: securityConfig.jwt.audience
        });

        // Find user and check if token is still valid
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated.' });
        }

        // Add user to request object
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Access denied. No user found.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.' 
            });
        }

        next();
    };
};

// Admin authorization
const adminAuth = authorize('admin');

// Teacher authorization
const teacherAuth = authorize('teacher');

// Student authorization
const studentAuth = authorize('student');

// Admin or Teacher authorization
const adminOrTeacherAuth = authorize('admin', 'teacher');

// Admin or Student authorization
const adminOrStudentAuth = authorize('admin', 'student');

// Optional auth - doesn't fail if no token, but adds user if valid token exists
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, securityConfig.jwt.secret, {
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience
            });

            const user = await User.findById(decoded.userId).select('-password');
            if (user && user.isActive) {
                req.user = user;
                req.token = token;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

module.exports = {
    auth,
    authorize,
    adminAuth,
    teacherAuth,
    studentAuth,
    adminOrTeacherAuth,
    adminOrStudentAuth,
    optionalAuth
}; 