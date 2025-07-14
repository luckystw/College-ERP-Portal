const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(authorize('admin'));

// @route   GET /api/sessions
// @desc    Get all sessions
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const sessions = await Session.find(query)
            .sort({ startDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Session.countDocuments(query);

        res.json({
            sessions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/sessions
// @desc    Create new session
// @access  Private
router.post('/', [
    body('name').notEmpty().withMessage('Session name is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, startDate, endDate, description, isActive } = req.body;

        // Check if session name already exists
        const existingSession = await Session.findOne({ name });
        if (existingSession) {
            return res.status(400).json({ message: 'Session name already exists' });
        }

        // If this session is being set as active, deactivate all other sessions
        if (isActive) {
            await Session.updateMany({}, { isActive: false });
        }

        const session = new Session({
            name,
            startDate,
            endDate,
            description,
            isActive: isActive || false
        });

        await session.save();

        res.status(201).json({ message: 'Session created successfully', session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/sessions/:id
// @desc    Update session
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { name, startDate, endDate, description, isActive } = req.body;
        
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if name is being changed and if it already exists
        if (name && name !== session.name) {
            const existingSession = await Session.findOne({ name });
            if (existingSession) {
                return res.status(400).json({ message: 'Session name already exists' });
            }
        }

        // If this session is being set as active, deactivate all other sessions
        if (isActive && !session.isActive) {
            await Session.updateMany({}, { isActive: false });
        }

        session.name = name || session.name;
        session.startDate = startDate || session.startDate;
        session.endDate = endDate || session.endDate;
        session.description = description || session.description;
        session.isActive = isActive !== undefined ? isActive : session.isActive;
        session.updatedAt = Date.now();

        await session.save();

        res.json({ message: 'Session updated successfully', session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete session
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Don't allow deletion of active session
        if (session.isActive) {
            return res.status(400).json({ message: 'Cannot delete active session' });
        }

        await Session.findByIdAndDelete(req.params.id);

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/sessions/:id/activate
// @desc    Activate a session
// @access  Private
router.put('/:id/activate', async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Deactivate all other sessions
        await Session.updateMany({}, { isActive: false });

        // Activate this session
        session.isActive = true;
        session.updatedAt = Date.now();
        await session.save();

        res.json({ message: 'Session activated successfully', session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 