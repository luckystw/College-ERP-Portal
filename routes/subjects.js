const express = require('express');
const { body, validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(authorize('admin'));

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', courseId } = req.query;
        
        const query = { isActive: true };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (courseId) {
            query.course = courseId;
        }

        const subjects = await Subject.find(query)
            .populate('course', 'name code')
            .populate('teacher', 'firstName lastName')
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Subject.countDocuments(query);

        res.json({
            subjects,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/subjects/:id
// @desc    Get subject by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id)
            .populate('course', 'name code')
            .populate('teacher', 'firstName lastName email');

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json(subject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private
router.post('/', [
    body('name').notEmpty().withMessage('Subject name is required'),
    body('code').notEmpty().withMessage('Subject code is required'),
    body('credits').isNumeric().withMessage('Credits must be a number'),
    body('course').notEmpty().withMessage('Course is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, code, description, credits, course, teacher } = req.body;

        // Check if subject code already exists
        const existingSubject = await Subject.findOne({ code });
        if (existingSubject) {
            return res.status(400).json({ message: 'Subject code already exists' });
        }

        // Verify course exists
        const courseExists = await Course.findById(course);
        if (!courseExists) {
            return res.status(400).json({ message: 'Course not found' });
        }

        // Verify teacher exists if provided
        if (teacher) {
            const teacherExists = await User.findOne({ _id: teacher, role: 'teacher' });
            if (!teacherExists) {
                return res.status(400).json({ message: 'Teacher not found' });
            }
        }

        const subject = new Subject({
            name,
            code,
            description,
            credits,
            course,
            teacher
        });

        await subject.save();

        // Add subject to course
        courseExists.subjects.push(subject._id);
        await courseExists.save();

        res.status(201).json({ message: 'Subject created successfully', subject });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { name, code, description, credits, course, teacher, isActive } = req.body;
        
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Check if code is being changed and if it already exists
        if (code && code !== subject.code) {
            const existingSubject = await Subject.findOne({ code });
            if (existingSubject) {
                return res.status(400).json({ message: 'Subject code already exists' });
            }
        }

        // Verify course exists if being changed
        if (course && course !== subject.course.toString()) {
            const courseExists = await Course.findById(course);
            if (!courseExists) {
                return res.status(400).json({ message: 'Course not found' });
            }
        }

        // Verify teacher exists if provided
        if (teacher) {
            const teacherExists = await User.findOne({ _id: teacher, role: 'teacher' });
            if (!teacherExists) {
                return res.status(400).json({ message: 'Teacher not found' });
            }
        }

        subject.name = name || subject.name;
        subject.code = code || subject.code;
        subject.description = description || subject.description;
        subject.credits = credits !== undefined ? credits : subject.credits;
        subject.course = course || subject.course;
        subject.teacher = teacher || subject.teacher;
        subject.isActive = isActive !== undefined ? isActive : subject.isActive;
        subject.updatedAt = Date.now();

        await subject.save();

        res.json({ message: 'Subject updated successfully', subject });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Soft delete - set isActive to false
        subject.isActive = false;
        subject.updatedAt = Date.now();
        await subject.save();

        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 