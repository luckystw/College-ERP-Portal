const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(authorize('admin'));

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        const query = { isActive: true };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const courses = await Course.find(query)
            .populate('subjects', 'name code')
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Course.countDocuments(query);

        res.json({
            courses,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('subjects', 'name code description credits');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private
router.post('/', [
    body('name').notEmpty().withMessage('Course name is required'),
    body('code').notEmpty().withMessage('Course code is required'),
    body('duration').notEmpty().withMessage('Duration is required'),
    body('fee').isNumeric().withMessage('Fee must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, code, description, duration, fee, subjects } = req.body;

        // Check if course code already exists
        const existingCourse = await Course.findOne({ code });
        if (existingCourse) {
            return res.status(400).json({ message: 'Course code already exists' });
        }

        const course = new Course({
            name,
            code,
            description,
            duration,
            fee,
            subjects: subjects || []
        });

        await course.save();

        res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { name, code, description, duration, fee, subjects, isActive } = req.body;
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if code is being changed and if it already exists
        if (code && code !== course.code) {
            const existingCourse = await Course.findOne({ code });
            if (existingCourse) {
                return res.status(400).json({ message: 'Course code already exists' });
            }
        }

        course.name = name || course.name;
        course.code = code || course.code;
        course.description = description || course.description;
        course.duration = duration || course.duration;
        course.fee = fee !== undefined ? fee : course.fee;
        course.subjects = subjects || course.subjects;
        course.isActive = isActive !== undefined ? isActive : course.isActive;
        course.updatedAt = Date.now();

        await course.save();

        res.json({ message: 'Course updated successfully', course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Soft delete - set isActive to false
        course.isActive = false;
        course.updatedAt = Date.now();
        await course.save();

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 