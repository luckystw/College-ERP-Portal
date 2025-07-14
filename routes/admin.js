const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard summary
// @access  Private
router.get('/dashboard', async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
        const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
        const totalCourses = await Course.countDocuments({ isActive: true });
        const totalSubjects = await Subject.countDocuments({ isActive: true });
        const activeSessions = await Session.countDocuments({ isActive: true });

        // Get recent activities
        const recentStudents = await User.find({ role: 'student' })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName email createdAt');

        const recentTeachers = await User.find({ role: 'teacher' })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName email createdAt');

        // Get attendance statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = await Attendance.countDocuments({ date: { $gte: today } });
        const presentToday = await Attendance.countDocuments({ 
            date: { $gte: today }, 
            status: 'present' 
        });

        res.json({
            summary: {
                totalStudents,
                totalTeachers,
                totalCourses,
                totalSubjects,
                activeSessions,
                todayAttendance,
                presentToday,
                attendancePercentage: todayAttendance > 0 ? (presentToday / todayAttendance * 100).toFixed(2) : 0
            },
            recentStudents,
            recentTeachers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private
router.get('/users', async (req, res) => {
    try {
        const { role, page = 1, limit = 10, search = '' } = req.query;
        
        const query = { isActive: true };
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private
router.post('/users', [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['admin', 'teacher', 'student']).withMessage('Invalid role')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, firstName, lastName, role, phone, address } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            role,
            phone,
            address
        });

        await user.save();

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private
router.put('/users/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, isActive } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.isActive = isActive !== undefined ? isActive : user.isActive;
        user.updatedAt = Date.now();

        await user.save();

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Soft delete - set isActive to false
        user.isActive = false;
        user.updatedAt = Date.now();
        await user.save();

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/performance
// @desc    Get performance analytics
// @access  Private
router.get('/performance', async (req, res) => {
    try {
        // Student performance by course
        const coursePerformance = await Result.aggregate([
            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subjectData'
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'subjectData.course',
                    foreignField: '_id',
                    as: 'courseData'
                }
            },
            {
                $group: {
                    _id: '$courseData.name',
                    avgPercentage: { $avg: '$percentage' },
                    totalStudents: { $sum: 1 }
                }
            }
        ]);

        // Teacher performance (based on student results)
        const teacherPerformance = await Result.aggregate([
            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subjectData'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'subjectData.teacher',
                    foreignField: '_id',
                    as: 'teacherData'
                }
            },
            {
                $group: {
                    _id: '$teacherData.firstName',
                    avgPercentage: { $avg: '$percentage' },
                    totalResults: { $sum: 1 }
                }
            }
        ]);

        res.json({
            coursePerformance,
            teacherPerformance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 