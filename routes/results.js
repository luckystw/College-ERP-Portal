const express = require('express');
const { body, validationResult } = require('express-validator');
const Result = require('../models/Result');
const Subject = require('../models/Subject');
const Session = require('../models/Session');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/results
// @desc    Get all results (Admin only)
// @access  Private
router.get('/', authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10, subjectId, studentId, examType, sessionId } = req.query;
        
        const query = {};
        if (subjectId) query.subject = subjectId;
        if (studentId) query.student = studentId;
        if (examType) query.examType = examType;
        if (sessionId) query.session = sessionId;

        const results = await Result.find(query)
            .populate('student', 'firstName lastName')
            .populate('subject', 'name code')
            .populate('session', 'name')
            .populate('addedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Result.countDocuments(query);

        res.json({
            results,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/results/teacher
// @desc    Get results for teacher's subjects
// @access  Private
router.get('/teacher', authorize('teacher'), async (req, res) => {
    try {
        const { page = 1, limit = 10, subjectId, examType } = req.query;
        
        // Get subjects taught by this teacher
        const subjects = await Subject.find({ teacher: req.user._id, isActive: true });
        const subjectIds = subjects.map(subject => subject._id);
        
        const query = { subject: { $in: subjectIds } };
        if (subjectId) query.subject = subjectId;
        if (examType) query.examType = examType;

        const results = await Result.find(query)
            .populate('student', 'firstName lastName')
            .populate('subject', 'name code')
            .populate('session', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Result.countDocuments(query);

        res.json({
            results,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/results/student
// @desc    Get results for student
// @access  Private
router.get('/student', authorize('student'), async (req, res) => {
    try {
        const { page = 1, limit = 10, subjectId, examType } = req.query;
        
        const query = { student: req.user._id };
        if (subjectId) query.subject = subjectId;
        if (examType) query.examType = examType;

        const results = await Result.find(query)
            .populate('subject', 'name code')
            .populate('session', 'name')
            .populate('addedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Result.countDocuments(query);

        res.json({
            results,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/results
// @desc    Add new result (Teacher only)
// @access  Private
router.post('/', [
    authorize('teacher'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('examType').isIn(['midterm', 'final', 'assignment', 'quiz']).withMessage('Invalid exam type'),
    body('marks').isNumeric().withMessage('Marks must be a number'),
    body('totalMarks').isNumeric().withMessage('Total marks must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
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
            return res.status(400).json({ message: 'Result already exists for this student, subject, and exam type' });
        }

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

        await result.save();

        res.status(201).json({ message: 'Result added successfully', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/results/:id
// @desc    Update result
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { marks, totalMarks, remarks } = req.body;
        
        const result = await Result.findById(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        // Check permissions
        if (req.user.role === 'teacher') {
            // Teacher can only update results for their subjects
            const subject = await Subject.findOne({ 
                _id: result.subject, 
                teacher: req.user._id 
            });
            if (!subject) {
                return res.status(403).json({ message: 'Not authorized to update this result' });
            }
        } else if (req.user.role === 'student') {
            // Students cannot update results
            return res.status(403).json({ message: 'Not authorized to update results' });
        }

        result.marks = marks !== undefined ? marks : result.marks;
        result.totalMarks = totalMarks !== undefined ? totalMarks : result.totalMarks;
        result.remarks = remarks || result.remarks;
        result.updatedAt = Date.now();

        await result.save();

        res.json({ message: 'Result updated successfully', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/results/:id
// @desc    Delete result (Admin only)
// @access  Private
router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        const result = await Result.findById(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        await Result.findByIdAndDelete(req.params.id);

        res.json({ message: 'Result deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/results/statistics
// @desc    Get result statistics
// @access  Private
router.get('/statistics', async (req, res) => {
    try {
        const { subjectId, sessionId } = req.query;
        
        let query = {};
        if (subjectId) query.subject = subjectId;
        if (sessionId) query.session = sessionId;

        // Get total results
        const totalResults = await Result.countDocuments(query);
        
        // Get average percentage
        const avgPercentage = await Result.aggregate([
            { $match: query },
            { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } }
        ]);

        // Get results by grade
        const gradeStats = await Result.aggregate([
            { $match: query },
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Get results by exam type
        const examTypeStats = await Result.aggregate([
            { $match: query },
            { $group: { _id: '$examType', count: { $sum: 1 }, avgPercentage: { $avg: '$percentage' } } }
        ]);

        res.json({
            summary: {
                totalResults,
                avgPercentage: avgPercentage.length > 0 ? avgPercentage[0].avgPercentage.toFixed(2) : 0
            },
            gradeStats,
            examTypeStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 