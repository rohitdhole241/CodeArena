const express = require('express');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const auth = require('../middleware/auth');
const judgeSimulator = require('../utils/judgeSimulator');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();

// @route   POST /api/submissions
// @desc    Submit code for a problem
// @access  Private
router.post('/', auth, [
    body('problemId').isMongoId().withMessage('Valid problem ID is required'),
    body('code').trim().isLength({ min: 1, max: 50000 }).withMessage('Code must be 1-50000 characters'),
    body('language').isIn(['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'])
        .withMessage('Invalid programming language')
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

        const { problemId, code, language } = req.body;

        // Check if problem exists
        const problem = await Problem.findOne({ _id: problemId, isActive: true });
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        // Create submission
        const submission = new Submission({
            userId: req.user._id,
            problemId,
            code,
            language,
            status: 'Pending',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await submission.save();

        // Process submission asynchronously
        processSubmission(submission._id, problem);

        res.status(201).json({
            success: true,
            message: 'Submission received and is being processed',
            data: {
                submissionId: submission._id,
                status: submission.status
            }
        });

    } catch (error) {
        console.error('Submit code error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during submission'
        });
    }
});

// @route   GET /api/submissions
// @desc    Get user submissions with filtering
// @access  Private
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('problemId').optional().isMongoId().withMessage('Valid problem ID required'),
    query('status').optional().isString().trim(),
    query('language').optional().isIn(['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'])
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
            problemId,
            status,
            language,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = req.query;

        const options = {
            problemId,
            status,
            language,
            limit: parseInt(limit),
            skip: (page - 1) * limit,
            sortBy,
            sortOrder: sortOrder === 'desc' ? -1 : 1
        };

        const submissions = await Submission.getUserSubmissions(req.user._id, options);
        
        // Get total count for pagination
        const query = { userId: req.user._id };
        if (problemId) query.problemId = problemId;
        if (status) query.status = status;
        if (language) query.language = language;
        
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
        console.error('Get submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching submissions'
        });
    }
});

// @route   GET /api/submissions/:id
// @desc    Get specific submission details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('problemId', 'title difficulty category')
            .populate('userId', 'fullName username');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Check if user owns this submission or is admin
        if (submission.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: submission
        });

    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching submission'
        });
    }
});

// @route   GET /api/submissions/:id/status
// @desc    Get submission status (for polling)
// @access  Private
router.get('/:id/status', auth, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .select('status metrics testResults judgedAt');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Check if user owns this submission
        if (submission.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: {
                status: submission.status,
                metrics: submission.metrics,
                testResults: submission.testResults?.length || 0,
                judgedAt: submission.judgedAt
            }
        });

    } catch (error) {
        console.error('Get submission status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching submission status'
        });
    }
});

// @route   POST /api/submissions/:id/run
// @desc    Run code against sample test cases (no submission)
// @access  Private
router.post('/:problemId/run', auth, [
    body('code').trim().isLength({ min: 1, max: 50000 }).withMessage('Code must be 1-50000 characters'),
    body('language').isIn(['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'])
        .withMessage('Invalid programming language')
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

        const { code, language } = req.body;
        const { problemId } = req.params;

        // Check if problem exists
        const problem = await Problem.findOne({ _id: problemId, isActive: true });
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        // Run code against sample test cases only
        const sampleTestCases = problem.testCases.filter(tc => !tc.isHidden).slice(0, 3);
        const results = await judgeSimulator.runCode(code, language, sampleTestCases);

        res.json({
            success: true,
            data: {
                results,
                totalTests: sampleTestCases.length,
                passedTests: results.filter(r => r.status === 'Passed').length
            }
        });

    } catch (error) {
        console.error('Run code error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while running code'
        });
    }
});

// Async function to process submission
async function processSubmission(submissionId, problem) {
    try {
        const submission = await Submission.findById(submissionId);
        if (!submission) return;

        // Update status to running
        submission.status = 'Running';
        await submission.save();

        // Run code against all test cases
        const testResults = await judgeSimulator.judgeSubmission(
            submission.code,
            submission.language,
            problem.testCases,
            problem.timeLimit,
            problem.memoryLimit
        );

        // Update submission with results
        submission.testResults = testResults;
        
        // Determine final status
        const passedTests = testResults.filter(result => result.status === 'Passed').length;
        const totalTests = testResults.length;

        if (passedTests === totalTests) {
            submission.status = 'Accepted';
        } else if (testResults.some(result => result.status === 'Timeout')) {
            submission.status = 'Time Limit Exceeded';
        } else if (testResults.some(result => result.status === 'Error')) {
            submission.status = 'Runtime Error';
        } else {
            submission.status = 'Wrong Answer';
        }

        await submission.save();

        // Update user and problem statistics
        await updateStatistics(submission, problem);

    } catch (error) {
        console.error('Process submission error:', error);
        
        // Update submission status to system error
        try {
            await Submission.findByIdAndUpdate(submissionId, {
                status: 'System Error',
                errorDetails: 'Internal processing error'
            });
        } catch (updateError) {
            console.error('Failed to update submission error status:', updateError);
        }
    }
}

// Helper function to update statistics
async function updateStatistics(submission, problem) {
    try {
        // Update user statistics
        const user = await User.findById(submission.userId);
        if (user) {
            user.updateStats(submission);
            await user.save();
        }

        // Update problem statistics
        problem.updateStats(submission);
        await problem.save();

    } catch (error) {
        console.error('Update statistics error:', error);
    }
}

module.exports = router;
