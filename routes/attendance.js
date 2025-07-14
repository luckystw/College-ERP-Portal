const express = require('express');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Session = require('../models/Session');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/attendance
// @desc    Get attendance records (Admin only)
// @access  Private
router.get('/', authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10, subjectId, studentId, date, status } = req.query;
        
        const query = {};
        if (subjectId) query.subject = subjectId;
        if (studentId) query.student = studentId;
        if (status) query.status = status;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query)
            .populate('student', 'firstName lastName')
            .populate('subject', 'name code')
            .populate('session', 'name')
            .populate('markedBy', 'firstName lastName')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Attendance.countDocuments(query);

        res.json({
            attendance,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/attendance/teacher
// @desc    Get attendance for teacher's subjects
// @access  Private
router.get('/teacher', authorize('teacher'), async (req, res) => {
    try {
        const { page = 1, limit = 10, subjectId, date, status } = req.query;
        
        // Get subjects taught by this teacher
        const subjects = await Subject.find({ teacher: req.user._id, isActive: true });
        const subjectIds = subjects.map(subject => subject._id);
        
        const query = { subject: { $in: subjectIds } };
        if (subjectId) query.subject = subjectId;
        if (status) query.status = status;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query)
            .populate('student', 'firstName lastName')
            .populate('subject', 'name code')
            .populate('session', 'name')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Attendance.countDocuments(query);

        res.json({
            attendance,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/attendance/student
// @desc    Get attendance for student
// @access  Private
router.get('/student', authorize('student'), async (req, res) => {
    try {
        const { page = 1, limit = 10, subjectId, startDate, endDate, status } = req.query;
        
        const query = { student: req.user._id };
        if (subjectId) query.subject = subjectId;
        if (status) query.status = status;
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query)
            .populate('subject', 'name code')
            .populate('session', 'name')
            .populate('markedBy', 'firstName lastName')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Attendance.countDocuments(query);

        res.json({
            attendance,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/attendance/statistics
// @desc    Get attendance statistics
// @access  Private
router.get('/statistics', async (req, res) => {
    try {
        const { subjectId, startDate, endDate } = req.query;
        
        let query = {};
        if (subjectId) query.subject = subjectId;
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Get total attendance records
        const totalAttendance = await Attendance.countDocuments(query);
        
        // Get attendance by status
        const presentCount = await Attendance.countDocuments({ ...query, status: 'present' });
        const absentCount = await Attendance.countDocuments({ ...query, status: 'absent' });
        const lateCount = await Attendance.countDocuments({ ...query, status: 'late' });
        const excusedCount = await Attendance.countDocuments({ ...query, status: 'excused' });

        // Calculate percentages
        const presentPercentage = totalAttendance > 0 ? (presentCount / totalAttendance * 100).toFixed(2) : 0;
        const absentPercentage = totalAttendance > 0 ? (absentCount / totalAttendance * 100).toFixed(2) : 0;
        const latePercentage = totalAttendance > 0 ? (lateCount / totalAttendance * 100).toFixed(2) : 0;
        const excusedPercentage = totalAttendance > 0 ? (excusedCount / totalAttendance * 100).toFixed(2) : 0;

        // Get attendance by date (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const dayAttendance = await Attendance.countDocuments({
                ...query,
                date: {
                    $gte: date,
                    $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
                }
            });
            
            const dayPresent = await Attendance.countDocuments({
                ...query,
                date: {
                    $gte: date,
                    $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
                },
                status: 'present'
            });

            last7Days.push({
                date: date.toISOString().split('T')[0],
                total: dayAttendance,
                present: dayPresent,
                percentage: dayAttendance > 0 ? (dayPresent / dayAttendance * 100).toFixed(2) : 0
            });
        }

        res.json({
            summary: {
                totalAttendance,
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                presentPercentage,
                absentPercentage,
                latePercentage,
                excusedPercentage
            },
            last7Days
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { status, remarks } = req.body;
        
        const attendance = await Attendance.findById(req.params.id);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        // Check permissions
        if (req.user.role === 'teacher') {
            // Teacher can only update attendance for their subjects
            const subject = await Subject.findOne({ 
                _id: attendance.subject, 
                teacher: req.user._id 
            });
            if (!subject) {
                return res.status(403).json({ message: 'Not authorized to update this attendance' });
            }
        } else if (req.user.role === 'student') {
            // Students cannot update attendance
            return res.status(403).json({ message: 'Not authorized to update attendance' });
        }

        attendance.status = status || attendance.status;
        attendance.remarks = remarks || attendance.remarks;
        attendance.updatedAt = Date.now();

        await attendance.save();

        res.json({ message: 'Attendance updated successfully', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 