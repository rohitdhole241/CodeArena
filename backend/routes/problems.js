const express = require('express');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();

// @route   GET /api/problems
// @desc    Get all problems with filtering and pagination
// @access  Private
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level'),
    query('category').optional().isString().trim()
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

        const {
            page = 1,
            limit = 20,
            difficulty,
            category,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (difficulty) query.difficulty = difficulty;
        if (category) query.category = category;
        if (search) query.$text = { $search: search };

        // Calculate pagination
        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'desc' ? -1 : 1;

        // Get problems
        const problems = await Problem.find(query)
            .select('-testCases') // Don't include test cases
            .sort({ [sortBy]: sortDirection })
            .limit(parseInt(limit))
            .skip(skip)
            .populate('createdBy', 'fullName username');

        // Get total count for pagination
        const totalProblems = await Problem.countDocuments(query);
        const totalPages = Math.ceil(totalProblems / limit);

        // Get user's solved problems
        const userSolvedProblems = req.user.solvedProblems.map(sp => sp.problemId.toString());

        // Add solved status to each problem
        const problemsWithStatus = problems.map(problem => ({
            ...problem.toObject(),
            solved: userSolvedProblems.includes(problem._id.toString()),
            acceptanceRate: problem.acceptanceRate
        }));

        res.json({
            success: true,
            data: {
                problems: problemsWithStatus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalProblems,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get problems error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching problems'
        });
    }
});

// @route   GET /api/problems/:id
// @desc    Get a specific problem by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const problem = await Problem.findOne({
            _id: req.params.id,
            isActive: true
        })
        .select('-testCases') // Don't include test cases for security
        .populate('createdBy', 'fullName username');

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        // Check if user has solved this problem
        const userSolved = req.user.solvedProblems.some(
            sp => sp.problemId.toString() === problem._id.toString()
        );

        // Get user's submissions for this problem
        const userSubmissions = await Submission.find({
            userId: req.user._id,
            problemId: problem._id
        }).select('status submittedAt language').sort({ submittedAt: -1 }).limit(5);

        res.json({
            success: true,
            data: {
                ...problem.toObject(),
                solved: userSolved,
                acceptanceRate: problem.acceptanceRate,
                userSubmissions
            }
        });

    } catch (error) {
        console.error('Get problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching problem'
        });
    }
});

// @route   POST /api/problems
// @desc    Create a new problem (Admin only)
// @access  Private (Admin)
router.post('/', auth, [
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level'),
    body('category').isString().trim().withMessage('Category is required'),
    body('examples').isArray({ min: 1 }).withMessage('At least one example is required'),
    body('constraints').isArray({ min: 1 }).withMessage('Constraints are required'),
    body('testCases').isArray({ min: 3 }).withMessage('At least 3 test cases are required')
], async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            title,
            description,
            difficulty,
            category,
            examples,
            constraints,
            testCases,
            hints = [],
            tags = [],
            starterCode = {}
        } = req.body;

        // Check if problem with same title exists
        const existingProblem = await Problem.findOne({ title });
        if (existingProblem) {
            return res.status(400).json({
                success: false,
                message: 'Problem with this title already exists'
            });
        }

        // Create new problem
        const newProblem = new Problem({
            title,
            description,
            difficulty,
            category,
            examples,
            constraints,
            testCases,
            hints,
            tags,
            starterCode,
            createdBy: req.user._id
        });

        await newProblem.save();

        res.status(201).json({
            success: true,
            message: 'Problem created successfully',
            data: newProblem
        });

    } catch (error) {
        console.error('Create problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating problem'
        });
    }
});

// @route   PUT /api/problems/:id
// @desc    Update a problem (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, [
    body('title').optional().trim().isLength({ min: 5, max: 200 }),
    body('description').optional().trim().isLength({ min: 20, max: 5000 }),
    body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
    body('category').optional().isString().trim()
], async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                problem[key] = req.body[key];
            }
        });

        await problem.save();

        res.json({
            success: true,
            message: 'Problem updated successfully',
            data: problem
        });

    } catch (error) {
        console.error('Update problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating problem'
        });
    }
});

// @route   DELETE /api/problems/:id
// @desc    Delete a problem (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        // Soft delete by setting isActive to false
        problem.isActive = false;
        await problem.save();

        res.json({
            success: true,
            message: 'Problem deleted successfully'
        });

    } catch (error) {
        console.error('Delete problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting problem'
        });
    }
});

// @route   GET /api/problems/:id/leaderboard
// @desc    Get leaderboard for a specific problem
// @access  Private
router.get('/:id/leaderboard', auth, async (req, res) => {
    try {
        const leaderboard = await Submission.getProblemLeaderboard(req.params.id, 20);

        res.json({
            success: true,
            data: leaderboard
        });

    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching leaderboard'
        });
    }
});

module.exports = router;
