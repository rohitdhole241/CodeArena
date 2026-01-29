const express = require('express');
const User = require('../models/User');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const { query, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/users/leaderboard
// @desc    Get user leaderboard
// @access  Private
router.get('/leaderboard', auth, [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['problemsSolved', 'acceptedSubmissions', 'currentStreak'])
        .withMessage('Invalid sort field')
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

        const { limit = 50, sortBy = 'problemsSolved' } = req.query;
        
        const leaderboard = await User.find({ isActive: true })
            .select('fullName username profileStats createdAt')
            .sort({ [`profileStats.${sortBy}`]: -1, 'profileStats.acceptedSubmissions': -1 })
            .limit(parseInt(limit));

        // Add rank to each user
        const leaderboardWithRank = leaderboard.map((user, index) => ({
            rank: index + 1,
            ...user.toObject()
        }));

        res.json({
            success: true,
            data: leaderboardWithRank
        });

    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching leaderboard'
        });
    }
});

// @route   GET /api/users/:id/profile
// @desc    Get user profile (public information)
// @access  Private
router.get('/:id/profile', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, isActive: true })
            .select('fullName username profileStats solvedProblems createdAt')
            .populate('solvedProblems.problemId', 'title difficulty category');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get recent submissions (last 10)
        const recentSubmissions = await Submission.find({ userId: user._id })
            .populate('problemId', 'title difficulty category')
            .select('status language submittedAt metrics')
            .sort({ submittedAt: -1 })
            .limit(10);

        // Calculate additional statistics
        const totalSubmissions = user.profileStats.totalSubmissions;
        const acceptedSubmissions = user.profileStats.acceptedSubmissions;
        const accuracyRate = totalSubmissions > 0 ? 
            Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

        // Group solved problems by difficulty
        const solvedByDifficulty = user.solvedProblems.reduce((acc, solved) => {
            const difficulty = solved.problemId.difficulty.toLowerCase();
            acc[difficulty] = (acc[difficulty] || 0) + 1;
            return acc;
        }, { easy: 0, medium: 0, hard: 0 });

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    username: user.username,
                    profileStats: user.profileStats,
                    accuracyRate,
                    solvedByDifficulty,
                    memberSince: user.createdAt
                },
                recentActivity: recentSubmissions,
                solvedProblems: user.solvedProblems.slice(-5) // Last 5 solved problems
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user profile'
        });
    }
});

// @route   GET /api/users/stats
// @desc    Get current user's detailed statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('solvedProblems.problemId', 'title difficulty category');

        // Get submission statistics
        const submissionStats = await Submission.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: null,
                    totalSubmissions: { $sum: 1 },
                    acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
                    languageDistribution: { $push: '$language' },
                    statusDistribution: { $push: '$status' },
                    avgExecutionTime: { $avg: '$metrics.executionTime' },
                    recentSubmissions: { $push: { submittedAt: '$submittedAt', status: '$status' } }
                }
            }
        ]);

        const stats = submissionStats[0] || {};

        // Process language distribution
        const languageCount = {};
        (stats.languageDistribution || []).forEach(lang => {
            languageCount[lang] = (languageCount[lang] || 0) + 1;
        });

        // Process status distribution
        const statusCount = {};
        (stats.statusDistribution || []).forEach(status => {
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        // Calculate streak information
        const submissions = await Submission.find({ userId: user._id, status: 'Accepted' })
            .sort({ submittedAt: -1 })
            .select('submittedAt');

        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;
        let lastDate = null;

        submissions.reverse().forEach(submission => {
            const submissionDate = new Date(submission.submittedAt).toDateString();
            
            if (!lastDate || submissionDate !== lastDate) {
                const daysDiff = lastDate ? 
                    (new Date(submissionDate) - new Date(lastDate)) / (1000 * 60 * 60 * 24) : 1;
                
                if (daysDiff === 1) {
                    tempStreak++;
                } else if (daysDiff > 1) {
                    maxStreak = Math.max(maxStreak, tempStreak);
                    tempStreak = 1;
                }
                
                lastDate = submissionDate;
            }
        });

        maxStreak = Math.max(maxStreak, tempStreak);
        
        // Check if current streak is active (last submission within 24 hours)
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        if (lastDate === today || lastDate === yesterday) {
            currentStreak = tempStreak;
        }

        res.json({
            success: true,
            data: {
                profileStats: user.profileStats,
                accuracyRate: user.profileStats.totalSubmissions > 0 ? 
                    Math.round((user.profileStats.acceptedSubmissions / user.profileStats.totalSubmissions) * 100) : 0,
                solvedByDifficulty: user.solvedProblems.reduce((acc, solved) => {
                    const difficulty = solved.problemId.difficulty.toLowerCase();
                    acc[difficulty] = (acc[difficulty] || 0) + 1;
                    return acc;
                }, { easy: 0, medium: 0, hard: 0 }),
                languageDistribution: languageCount,
                statusDistribution: statusCount,
                streakInfo: {
                    current: currentStreak,
                    maximum: maxStreak
                },
                avgExecutionTime: Math.round(stats.avgExecutionTime || 0),
                recentProblems: user.solvedProblems.slice(-10)
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user statistics'
        });
    }
});

// @route   GET /api/users/search
// @desc    Search users by username or full name
// @access  Private
router.get('/search', auth, [
    query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

        const { q, limit = 20 } = req.query;

        const users = await User.find({
            isActive: true,
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { fullName: { $regex: q, $options: 'i' } }
            ]
        })
        .select('fullName username profileStats')
        .limit(parseInt(limit))
        .sort({ 'profileStats.problemsSolved': -1 });

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while searching users'
        });
    }
});

module.exports = router;
