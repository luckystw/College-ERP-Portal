const express = require('express');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Session = require('../models/Session');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(authorize('student'));

// @route   GET /api/student/dashboard
// @desc    Get student dashboard summary
// @access  Private
router.get('/dashboard', async (req, res) => {
    try {
        // Get active session
        const activeSession = await Session.findOne({ isActive: true });
        if (!activeSession) {
            return res.status(400).json({ message: 'No active session found' });
        }

        // Get all subjects (in a real system, you'd have enrollment data)
        const subjects = await Subject.find({ isActive: true })
            .populate('course', 'name')
            .populate('teacher', 'firstName lastName');

        // Get attendance statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = await Attendance.countDocuments({
            student: req.user._id,
            date: { $gte: today }
        });

        const presentToday = await Attendance.countDocuments({
            student: req.user._id,
            date: { $gte: today },
            status: 'present'
        });

        // Get overall attendance percentage
        const totalAttendance = await Attendance.countDocuments({
            student: req.user._id,
            session: activeSession._id
        });

        const totalPresent = await Attendance.countDocuments({
            student: req.user._id,
            session: activeSession._id,
            status: 'present'
        });

        // Get recent results
        const recentResults = await Result.find({ 
            student: req.user._id,
            session: activeSession._id
        })
            .populate('subject', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Calculate average percentage
        const avgPercentage = recentResults.length > 0 
            ? (recentResults.reduce((sum, result) => sum + result.percentage, 0) / recentResults.length).toFixed(2)
            : 0;

        res.json({
            summary: {
                totalSubjects: subjects.length,
                todayAttendance,
                presentToday,
                todayAttendancePercentage: todayAttendance > 0 ? (presentToday / todayAttendance * 100).toFixed(2) : 0,
                overallAttendancePercentage: totalAttendance > 0 ? (totalPresent / totalAttendance * 100).toFixed(2) : 0,
                avgPercentage
            },
            subjects,
            recentResults
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/attendance
// @desc    Get student attendance
// @access  Private
router.get('/attendance', async (req, res) => {
    try {
        const { subjectId, startDate, endDate } = req.query;

        // Get active session
        const activeSession = await Session.findOne({ isActive: true });
        if (!activeSession) {
            return res.status(400).json({ message: 'No active session found' });
        }

        let query = { 
            student: req.user._id,
            session: activeSession._id
        };

        if (subjectId) {
            query.subject = subjectId;
        }

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query)
            .populate('subject', 'name')
            .populate('markedBy', 'firstName lastName')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/results
// @desc    Get student results
// @access  Private
router.get('/results', async (req, res) => {
    try {
        const { subjectId, examType } = req.query;

        // Get active session
        const activeSession = await Session.findOne({ isActive: true });
        if (!activeSession) {
            return res.status(400).json({ message: 'No active session found' });
        }

        let query = { 
            student: req.user._id,
            session: activeSession._id
        };

        if (subjectId) {
            query.subject = subjectId;
        }

        if (examType) {
            query.examType = examType;
        }

        const results = await Result.find(query)
            .populate('subject', 'name')
            .populate('addedBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/subjects
// @desc    Get subjects for student
// @access  Private
router.get('/subjects', async (req, res) => {
    try {
        // Get all subjects (in a real system, you'd have enrollment data)
        const subjects = await Subject.find({ isActive: true })
            .populate('course', 'name')
            .populate('teacher', 'firstName lastName')
            .sort({ name: 1 });

        res.json(subjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/profile
// @desc    Get student profile
// @access  Private
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 