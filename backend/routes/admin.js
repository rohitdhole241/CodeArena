const express = require('express');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to check admin privileges
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', auth, adminOnly, async (req, res) => {
    try {
        // Get basic counts
        const [totalUsers, totalProblems, totalSubmissions] = await Promise.all([
            User.countDocuments({ isActive: true }),
            Problem.countDocuments({ isActive: true }),
            Submission.countDocuments()
        ]);

        // Get submission statistics
        const submissionStats = await Submission.aggregate([
            {
                $group: {
                    _id: null,
                    totalSubmissions: { $sum: 1 },
                    acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
                    statusDistribution: {
                        $push: '$status'
                    },
                    languageDistribution: {
                        $push: '$language'
                    }
                }
            }
        ]);

        const stats = submissionStats[0] || {};
        const successRate = stats.totalSubmissions > 0 ? 
            Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) : 0;

        // Process status distribution
        const statusCount = {};
        (stats.statusDistribution || []).forEach(status => {
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        // Process language distribution
        const languageCount = {};
        (stats.languageDistribution || []).forEach(lang => {
            languageCount[lang] = (languageCount[lang] || 0) + 1;
        });

        // Get recent activity
        const recentSubmissions = await Submission.find()
            .populate('userId', 'fullName username')
            .populate('problemId', 'title difficulty')
            .select('status language submittedAt')
            .sort({ submittedAt: -1 })
            .limit(10);

        // Get problem difficulty distribution
        const problemStats = await Problem.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$difficulty',
                    count: { $sum: 1 }
                }
            }
        ]);

        const problemDifficultyCount = {};
        problemStats.forEach(stat => {
            problemDifficultyCount[stat._id.toLowerCase()] = stat.count;
        });

        // Get monthly user registration data (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const userRegistrations = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalProblems,
                    totalSubmissions,
                    successRate
                },
                distributions: {
                    status: statusCount,
                    languages: languageCount,
                    problemDifficulty: problemDifficultyCount
                },
                recentActivity: recentSubmissions,
                userGrowth: userRegistrations
            }
        });

    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching admin dashboard'
        });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users with admin controls
// @access  Private (Admin only)
router.get('/users', auth, adminOnly, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim(),
    query('role').optional().isIn(['user', 'admin']),
    query('status').optional().isIn(['active', 'inactive'])
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
            search,
            role,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) query.role = role;
        if (status) query.isActive = status === 'active';

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'desc' ? -1 : 1;

        const users = await User.find(query)
            .select('fullName username email role profileStats isActive createdAt lastLoginAt')
            .sort({ [sortBy]: sortDirection })
            .limit(parseInt(limit))
            .skip(skip);

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalUsers,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user details (Admin only)
// @access  Private (Admin only)
router.put('/users/:id', auth, adminOnly, [
    body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
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

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deactivating themselves
        if (req.params.id === req.user._id.toString() && req.body.isActive === false) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        // Update allowed fields
        const { role, isActive } = req.body;
        if (role !== undefined) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user'
        });
    }
});

// @route   GET /api/admin/problems
// @desc    Get all problems for admin management
// @access  Private (Admin only)
router.get('/problems', auth, adminOnly, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim(),
    query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
    query('category').optional().isString().trim(),
    query('status').optional().isIn(['active', 'inactive'])
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
            search,
            difficulty,
            category,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        if (search) query.$text = { $search: search };
        if (difficulty) query.difficulty = difficulty;
        if (category) query.category = category;
        if (status) query.isActive = status === 'active';

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'desc' ? -1 : 1;

        const problems = await Problem.find(query)
            .populate('createdBy', 'fullName username')
            .sort({ [sortBy]: sortDirection })
            .limit(parseInt(limit))
            .skip(skip);

        const totalProblems = await Problem.countDocuments(query);
        const totalPages = Math.ceil(totalProblems / limit);

        // Add acceptance rate to each problem
        const problemsWithStats = problems.map(problem => ({
            ...problem.toObject(),
            acceptanceRate: problem.acceptanceRate
        }));

        res.json({
            success: true,
            data: {
                problems: problemsWithStats,
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
        console.error('Get admin problems error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching problems'
        });
    }
});

// @route   GET /api/admin/submissions
// @desc    Get all submissions for admin monitoring
// @access  Private (Admin only)
router.get('/submissions', auth, adminOnly, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isString().trim(),
    query('language').optional().isString().trim(),
    query('userId').optional().isMongoId(),
    query('problemId').optional().isMongoId()
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
            limit = 50,
            status,
            language,
            userId,
            problemId,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        if (status) query.status = status;
        if (language) query.language = language;
        if (userId) query.userId = userId;
        if (problemId) query.problemId = problemId;

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'desc' ? -1 : 1;

        const submissions = await Submission.find(query)
            .populate('userId', 'fullName username')
            .populate('problemId', 'title difficulty category')
            .select('status language metrics submittedAt judgedAt')
            .sort({ [sortBy]: sortDirection })
            .limit(parseInt(limit))
            .skip(skip);

        const totalSubmissions = await Submission.countDocuments(query);
        const totalPages = Math.ceil(totalSubmissions / limit);

        res.json({
            success: true,
            data: {
                submissions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalSubmissions,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get admin submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching submissions'
        });
    }
});

// @route   DELETE /api/admin/submissions/:id
// @desc    Delete a submission (Admin only)
// @access  Private (Admin only)
router.delete('/submissions/:id', auth, adminOnly, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        await Submission.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Submission deleted successfully'
        });

    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting submission'
        });
    }
});

module.exports = router;
