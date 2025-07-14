const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Session = require('../models/Session');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(authorize('teacher'));

// @route   GET /api/teacher/dashboard
// @desc    Get teacher dashboard summary
// @access  Private
router.get('/dashboard', async (req, res) => {
    try {
        // Get subjects taught by this teacher
        const subjects = await Subject.find({ teacher: req.user._id, isActive: true })
            .populate('course', 'name');

        const subjectIds = subjects.map(subject => subject._id);

        // Get total students in teacher's subjects
        const totalStudents = await User.countDocuments({ 
            role: 'student', 
            isActive: true 
        });

        // Get today's attendance for teacher's subjects
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = await Attendance.countDocuments({
            subject: { $in: subjectIds },
            date: { $gte: today }
        });

        const presentToday = await Attendance.countDocuments({
            subject: { $in: subjectIds },
            date: { $gte: today },
            status: 'present'
        });

        // Get recent results
        const recentResults = await Result.find({ subject: { $in: subjectIds } })
            .populate('student', 'firstName lastName')
            .populate('subject', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            summary: {
                totalSubjects: subjects.length,
                totalStudents,
                todayAttendance,
                presentToday,
                attendancePercentage: todayAttendance > 0 ? (presentToday / todayAttendance * 100).toFixed(2) : 0
            },
            subjects,
            recentResults
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/teacher/subjects
// @desc    Get subjects taught by teacher
// @access  Private
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find({ teacher: req.user._id, isActive: true })
            .populate('course', 'name')
            .sort({ name: 1 });

        res.json(subjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/teacher/students
// @desc    Get students for teacher's subjects
// @access  Private
router.get('/students', async (req, res) => {
    try {
        const { subjectId } = req.query;
        
        if (!subjectId) {
            return res.status(400).json({ message: 'Subject ID is required' });
        }

        // Verify teacher teaches this subject
        const subject = await Subject.findOne({ 
            _id: subjectId, 
            teacher: req.user._id, 
            isActive: true 
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Get all students (in a real system, you'd have enrollment data)
        const students = await User.find({ role: 'student', isActive: true })
            .select('firstName lastName email')
            .sort({ firstName: 1 });

        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/teacher/attendance
// @desc    Mark attendance for students
// @access  Private
router.post('/attendance', [
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('attendanceData').isArray().withMessage('Attendance data is required')
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() });
        }

        const { subjectId, date, attendanceData } = req.body;

        // Verify teacher teaches this subject
        const subject = await Subject.findOne({ 
            _id: subjectId, 
            teacher: req.user._id, 
            isActive: true 
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Get active session
        const activeSession = await Session.findOne({ isActive: true });
        if (!activeSession) {
            return res.status(400).json({ message: 'No active session found' });
        }

        const processingErrors = [];

        for (const record of attendanceData) {
            try {
                // Check if attendance already exists for this student, subject, and date
                const existingAttendance = await Attendance.findOne({
                    student: record.studentId,
                    subject: subjectId,
                    date: new Date(date)
                });

                if (existingAttendance) {
                    // Update existing attendance
                    existingAttendance.status = record.status;
                    existingAttendance.remarks = record.remarks;
                    existingAttendance.updatedAt = Date.now();
                    await existingAttendance.save();
                } else {
                    // Create new attendance record
                    const attendance = new Attendance({
                        student: record.studentId,
                        subject: subjectId,
                        session: activeSession._id,
                        date: new Date(date),
                        status: record.status,
                        remarks: record.remarks,
                        markedBy: req.user._id
                    });
                    await attendance.save();
                }
            } catch (error) {
                processingErrors.push(`Error processing student ${record.studentId}: ${error.message}`);
            }
        }

        if (processingErrors.length > 0) {
            return res.status(400).json({ 
                message: 'Some attendance records could not be saved', 
                errors: processingErrors 
            });
        }

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/teacher/attendance/:subjectId
// @desc    Get attendance for a specific subject
// @access  Private
router.get('/attendance/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { date } = req.query;

        // Verify teacher teaches this subject
        const subject = await Subject.findOne({ 
            _id: subjectId, 
            teacher: req.user._id, 
            isActive: true 
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        let query = { subject: subjectId };
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query)
            .populate('student', 'firstName lastName')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/teacher/results
// @desc    Add/Update student results
// @access  Private
router.post('/results', [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('examType').isIn(['midterm', 'final', 'assignment', 'quiz']).withMessage('Invalid exam type'),
    body('marks').isNumeric().withMessage('Marks must be a number'),
    body('totalMarks').isNumeric().withMessage('Total marks must be a number')
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() });
        }

        const { studentId, subjectId, examType, marks, totalMarks, remarks } = req.body;

        // Verify teacher teaches this subject
        const subject = await Subject.findOne({ 
            _id: subjectId, 
            teacher: req.user._id, 
            isActive: true 
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Get active session
        const activeSession = await Session.findOne({ isActive: true });
        if (!activeSession) {
            return res.status(400).json({ message: 'No active session found' });
        }

        // Check if result already exists
        let result = await Result.findOne({
            student: studentId,
            subject: subjectId,
            session: activeSession._id,
            examType
        });

        if (result) {
            // Update existing result
            result.marks = marks;
            result.totalMarks = totalMarks;
            result.remarks = remarks;
            result.updatedAt = Date.now();
        } else {
            // Create new result
            result = new Result({
                student: studentId,
                subject: subjectId,
                session: activeSession._id,
                examType,
                marks,
                totalMarks,
                remarks,
                addedBy: req.user._id
            });
        }

        await result.save();

        res.json({ message: 'Result saved successfully', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/teacher/results/:subjectId
// @desc    Get results for a specific subject
// @access  Private
router.get('/results/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { examType } = req.query;

        // Verify teacher teaches this subject
        const subject = await Subject.findOne({ 
            _id: subjectId, 
            teacher: req.user._id, 
            isActive: true 
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        let query = { subject: subjectId };
        if (examType) {
            query.examType = examType;
        }

        const results = await Result.find(query)
            .populate('student', 'firstName lastName')
            .populate('session', 'name')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 