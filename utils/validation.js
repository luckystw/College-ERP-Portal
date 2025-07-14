const { body, param, query, validationResult } = require('express-validator');
const securityConfig = require('../config/security');

// Sanitize and validate common patterns
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

// Password validation
const validatePassword = (password) => {
    const config = securityConfig.password;
    const errors = [];

    if (password.length < config.minLength) {
        errors.push(`Password must be at least ${config.minLength} characters long`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return errors;
};

// Email validation
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= securityConfig.validation.email.maxLength;
};

// Username validation
const validateUsername = (username) => {
    const config = securityConfig.validation.username;
    
    if (username.length < config.minLength || username.length > config.maxLength) {
        return false;
    }
    
    return config.pattern.test(username);
};

// Name validation
const validateName = (name) => {
    const config = securityConfig.validation.name;
    
    if (name.length < config.minLength || name.length > config.maxLength) {
        return false;
    }
    
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name);
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Common validation rules
const commonValidations = {
    // User registration
    registerUser: [
        body('username')
            .isLength({ min: 3, max: 30 })
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores')
            .customSanitizer(sanitizeInput),
        
        body('email')
            .isEmail()
            .normalizeEmail()
            .isLength({ max: 254 })
            .withMessage('Please provide a valid email address'),
        
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .custom((value) => {
                const errors = validatePassword(value);
                if (errors.length > 0) {
                    throw new Error(errors.join(', '));
                }
                return true;
            }),
        
        body('firstName')
            .isLength({ min: 2, max: 50 })
            .matches(/^[a-zA-Z\s\-']+$/)
            .withMessage('First name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes')
            .customSanitizer(sanitizeInput),
        
        body('lastName')
            .isLength({ min: 2, max: 50 })
            .matches(/^[a-zA-Z\s\-']+$/)
            .withMessage('Last name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes')
            .customSanitizer(sanitizeInput),
        
        body('role')
            .isIn(['admin', 'teacher', 'student'])
            .withMessage('Role must be admin, teacher, or student'),
        
        handleValidationErrors
    ],

    // User login
    loginUser: [
        body('username')
            .notEmpty()
            .withMessage('Username is required')
            .customSanitizer(sanitizeInput),
        
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        
        handleValidationErrors
    ],

    // Course creation/update
    course: [
        body('name')
            .isLength({ min: 2, max: 100 })
            .withMessage('Course name must be 2-100 characters')
            .customSanitizer(sanitizeInput),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters')
            .customSanitizer(sanitizeInput),
        
        body('duration')
            .isInt({ min: 1, max: 12 })
            .withMessage('Duration must be between 1 and 12 months'),
        
        handleValidationErrors
    ],

    // Subject creation/update
    subject: [
        body('name')
            .isLength({ min: 2, max: 100 })
            .withMessage('Subject name must be 2-100 characters')
            .customSanitizer(sanitizeInput),
        
        body('code')
            .isLength({ min: 2, max: 20 })
            .matches(/^[A-Z0-9]+$/)
            .withMessage('Subject code must be 2-20 uppercase letters and numbers')
            .customSanitizer(sanitizeInput),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters')
            .customSanitizer(sanitizeInput),
        
        handleValidationErrors
    ],

    // Session creation/update
    session: [
        body('name')
            .isLength({ min: 2, max: 100 })
            .withMessage('Session name must be 2-100 characters')
            .customSanitizer(sanitizeInput),
        
        body('startDate')
            .isISO8601()
            .withMessage('Start date must be a valid date'),
        
        body('endDate')
            .isISO8601()
            .withMessage('End date must be a valid date')
            .custom((endDate, { req }) => {
                if (new Date(endDate) <= new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        
        handleValidationErrors
    ],

    // Attendance creation/update
    attendance: [
        body('studentId')
            .isMongoId()
            .withMessage('Valid student ID is required'),
        
        body('subjectId')
            .isMongoId()
            .withMessage('Valid subject ID is required'),
        
        body('sessionId')
            .isMongoId()
            .withMessage('Valid session ID is required'),
        
        body('date')
            .isISO8601()
            .withMessage('Date must be a valid date'),
        
        body('status')
            .isIn(['present', 'absent', 'late'])
            .withMessage('Status must be present, absent, or late'),
        
        handleValidationErrors
    ],

    // Result creation/update
    result: [
        body('studentId')
            .isMongoId()
            .withMessage('Valid student ID is required'),
        
        body('subjectId')
            .isMongoId()
            .withMessage('Valid subject ID is required'),
        
        body('sessionId')
            .isMongoId()
            .withMessage('Valid session ID is required'),
        
        body('marks')
            .isFloat({ min: 0, max: 100 })
            .withMessage('Marks must be between 0 and 100'),
        
        body('totalMarks')
            .isFloat({ min: 1 })
            .withMessage('Total marks must be greater than 0'),
        
        body('examType')
            .isIn(['midterm', 'final', 'assignment', 'quiz'])
            .withMessage('Exam type must be midterm, final, assignment, or quiz'),
        
        handleValidationErrors
    ],

    // ID validation
    validateId: [
        param('id')
            .isMongoId()
            .withMessage('Valid ID is required'),
        
        handleValidationErrors
    ],

    // Pagination
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        
        handleValidationErrors
    ]
};

module.exports = {
    sanitizeInput,
    validatePassword,
    validateEmail,
    validateUsername,
    validateName,
    handleValidationErrors,
    commonValidations
}; 