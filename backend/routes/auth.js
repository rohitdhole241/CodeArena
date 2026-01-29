const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { fullName, username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email 
                    ? 'Email already registered' 
                    : 'Username already taken'
            });
        }

        // Create new user
        const newUser = new User({
            fullName,
            username,
            email,
            password
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }

        // Verify password
        const isPasswordCorrect = await user.correctPassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login time
        user.lastLoginAt = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileStats: user.profileStats
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('solvedProblems.problemId', 'title difficulty');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileStats: user.profileStats,
                solvedProblems: user.solvedProblems,
                preferences: user.preferences,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
    body('username').optional().trim().isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const token = req.headers.authorization?.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        const { fullName, username, preferredLanguage, theme } = req.body;

        // Check if username is being changed and if it's available
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
            user.username = username;
        }

        if (fullName) user.fullName = fullName;
        if (preferredLanguage) user.preferences.preferredLanguage = preferredLanguage;
        if (theme) user.preferences.theme = theme;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                preferences: user.preferences
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during profile update'
        });
    }
});

module.exports = router;
