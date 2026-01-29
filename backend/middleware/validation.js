const { body, validationResult } = require('express-validator');

// Common validation rules
const validationRules = {
    // User validation
    userRegistration: [
        body('fullName')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be 2-100 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Full name can only contain letters and spaces'),
        
        body('username')
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be 3-30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores')
            .toLowerCase(),
        
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        
        body('password')
            .isLength({ min: 6, max: 128 })
            .withMessage('Password must be 6-128 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
    ],

    userLogin: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],

    // Problem validation
    problemCreation: [
        body('title')
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Title must be 5-200 characters'),
        
        body('description')
            .trim()
            .isLength({ min: 20, max: 5000 })
            .withMessage('Description must be 20-5000 characters'),
        
        body('difficulty')
            .isIn(['Easy', 'Medium', 'Hard'])
            .withMessage('Difficulty must be Easy, Medium, or Hard'),
        
        body('category')
            .isIn([
                'Array', 'String', 'Linked List', 'Tree', 'Graph', 
                'Dynamic Programming', 'Greedy', 'Backtracking', 
                'Binary Search', 'Two Pointers', 'Hash Table',
                'Stack', 'Queue', 'Heap', 'Trie', 'Math'
            ])
            .withMessage('Please select a valid category'),
        
        body('examples')
            .isArray({ min: 1 })
            .withMessage('At least one example is required'),
        
        body('examples.*.input')
            .notEmpty()
            .withMessage('Example input is required'),
        
        body('examples.*.output')
            .notEmpty()
            .withMessage('Example output is required'),
        
        body('constraints')
            .isArray({ min: 1 })
            .withMessage('At least one constraint is required'),
        
        body('testCases')
            .isArray({ min: 3 })
            .withMessage('At least 3 test cases are required'),
        
        body('testCases.*.input')
            .notEmpty()
            .withMessage('Test case input is required'),
        
        body('testCases.*.expectedOutput')
            .notEmpty()
            .withMessage('Test case expected output is required')
    ],

    // Submission validation
    codeSubmission: [
        body('problemId')
            .isMongoId()
            .withMessage('Valid problem ID is required'),
        
        body('code')
            .trim()
            .isLength({ min: 1, max: 50000 })
            .withMessage('Code must be 1-50000 characters'),
        
        body('language')
            .isIn(['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'])
            .withMessage('Please select a supported programming language')
    ],

    // Profile update validation
    profileUpdate: [
        body('fullName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be 2-100 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Full name can only contain letters and spaces'),
        
        body('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be 3-30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        
        body('preferredLanguage')
            .optional()
            .isIn(['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'])
            .withMessage('Invalid preferred language'),
        
        body('theme')
            .optional()
            .isIn(['light', 'dark'])
            .withMessage('Theme must be light or dark')
    ]
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Remove any potentially harmful characters
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+\s*=/gi, '') // Remove event handlers
                .trim();
        }
        return value;
    };

    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                } else {
                    obj[key] = sanitizeValue(obj[key]);
                }
            }
        }
    };

    // Sanitize request body
    if (req.body) {
        sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        sanitizeObject(req.query);
    }

    next();
};

// Rate limiting helper
const createRateLimitMessage = (windowMs, maxRequests) => {
    const windowMinutes = windowMs / (1000 * 60);
    return `Too many requests. You can make up to ${maxRequests} requests per ${windowMinutes} minute${windowMinutes > 1 ? 's' : ''}.`;
};

module.exports = {
    validationRules,
    handleValidationErrors,
    sanitizeInput,
    createRateLimitMessage
};
