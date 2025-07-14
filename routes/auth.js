const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { commonValidations } = require('../utils/validation');
const securityConfig = require('../config/security');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', commonValidations.loginUser, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token with security config
        const token = jwt.sign(
            { userId: user._id },
            securityConfig.jwt.secret,
            {
                expiresIn: securityConfig.jwt.expiresIn,
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience
            }
        );

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Return user data without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private
router.post('/register', commonValidations.registerUser, async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.username === username 
                    ? 'Username already exists' 
                    : 'Email already exists'
            });
        }

        // Create new user (password will be hashed by User model pre-save hook)
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            role,
            isActive: true
        });

        await user.save();

        // Generate JWT token with security config
        const token = jwt.sign(
            { userId: user._id },
            securityConfig.jwt.secret,
            {
                expiresIn: securityConfig.jwt.expiresIn,
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience
            }
        );

        // Return user data without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, address } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.updatedAt = Date.now();

        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Validate new password
        const passwordErrors = require('../utils/validation').validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ message: passwordErrors.join(', ') });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = securityConfig.password.saltRounds;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error during password change' });
    }
});

// Logout (client-side token removal)
router.post('/logout', auth, async (req, res) => {
    try {
        // In a more advanced setup, you might want to blacklist the token
        // For now, we'll just return success and let the client remove the token
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
});

// Refresh token (optional - for longer sessions)
router.post('/refresh', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        // Generate new token
        const newToken = jwt.sign(
            { userId: user._id },
            securityConfig.jwt.secret,
            {
                expiresIn: securityConfig.jwt.expiresIn,
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience
            }
        );

        res.json({
            message: 'Token refreshed successfully',
            token: newToken
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Server error during token refresh' });
    }
});

module.exports = router; 