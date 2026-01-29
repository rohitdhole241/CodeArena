const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const judgeSimulator = require('../utils/judgeSimulator');

class SubmissionController {
    // Submit code for a problem
    static async submitCode(req, res) {
        try {
            const { problemId, code, language } = req.body;

            // Check if problem exists and is active
            const problem = await Problem.findOne({ _id: problemId, isActive: true });
            if (!problem) {
                return res.status(404).json({
                    success: false,
                    message: 'Problem not found or inactive'
                });
            }

            // Create submission record
            const submission = new Submission({
                userId: req.user._id,
                problemId,
                code: code.trim(),
                language,
                status: 'Pending',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            await submission.save();

            // Process submission asynchronously
            this.processSubmissionAsync(submission._id, problem);

            console.log(`New submission: ${req.user.username} -> ${problem.title} (${language})`);

            res.status(201).json({
                success: true,
                message: 'Code submitted successfully and is being judged',
                data: {
                    submissionId: submission._id,
                    status: submission.status,
                    problemTitle: problem.title,
                    language: submission.language,
                    submittedAt: submission.submittedAt
                }
            });

        } catch (error) {
            console.error('Submit code error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during code submission'
            });
        }
    }

    // Run code against sample test cases (no submission)
    static async runCode(req, res) {
        try {
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

            // Get only sample test cases (non-hidden, first 3)
            const sampleTestCases = problem.testCases
                .filter(tc => !tc.isHidden)
                .slice(0, 3);

            if (sampleTestCases.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No sample test cases available'
                });
            }

            // Run code against sample test cases
            const results = await judgeSimulator.runCode(code, language, sampleTestCases);

            const passedTests = results.filter(r => r.status === 'Passed').length;
            const totalTests = results.length;

            res.json({
                success: true,
                message: 'Code executed successfully',
                data: {
                    results,
                    summary: {
                        totalTests,
                        passedTests,
                        failedTests: totalTests - passedTests,
                        status: passedTests === totalTests ? 'All Passed' : 'Some Failed'
                    }
                }
            });

        } catch (error) {
            console.error('Run code error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while running code'
            });
        }
    }

    // Get user submissions with filtering
    static async getUserSubmissions(req, res) {
        try {
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
            const queryConditions = { userId: req.user._id };
            if (problemId) queryConditions.problemId = problemId;
            if (status) queryConditions.status = status;
            if (language) queryConditions.language = language;
            
            const totalSubmissions = await Submission.countDocuments(queryConditions);
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
            console.error('Get user submissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching submissions'
            });
        }
    }

    // Get specific submission details
    static async getSubmissionById(req, res) {
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
                    message: 'Access denied. You can only view your own submissions.'
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
    }

    // Get submission status (for polling during judging)
    static async getSubmissionStatus(req, res) {
        try {
            const submission = await Submission.findById(req.params.id)
                .select('status metrics testResults judgedAt errorDetails');

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

            const isComplete = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 
                               'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 
                               'System Error'].includes(submission.status);

            res.json({
                success: true,
                data: {
                    status: submission.status,
                    isComplete,
                    metrics: submission.metrics,
                    testResultsCount: submission.testResults?.length || 0,
                    judgedAt: submission.judgedAt,
                    errorDetails: submission.errorDetails
                }
            });

        } catch (error) {
            console.error('Get submission status error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching submission status'
            });
        }
    }

    // Get leaderboard for a specific problem
    static async getProblemLeaderboard(req, res) {
        try {
            const { problemId } = req.params;
            const { limit = 20 } = req.query;

            // Check if problem exists
            const problem = await Problem.findOne({ _id: problemId, isActive: true });
            if (!problem) {
                return res.status(404).json({
                    success: false,
                    message: 'Problem not found'
                });
            }

            const leaderboard = await Submission.getProblemLeaderboard(problemId, parseInt(limit));

            res.json({
                success: true,
                data: {
                    problemTitle: problem.title,
                    leaderboard
                }
            });

        } catch (error) {
            console.error('Get problem leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching leaderboard'
            });
        }
    }

    // Process submission asynchronously
    static async processSubmissionAsync(submissionId, problem) {
        try {
            console.log(`Processing submission: ${submissionId}`);
            
            const submission = await Submission.findById(submissionId);
            if (!submission) {
                console.error(`Submission not found: ${submissionId}`);
                return;
            }

            // Update status to running
            submission.status = 'Running';
            await submission.save();

            // Judge the submission
            const judgeResult = await judgeSimulator.judgeSubmission(
                submission.code,
                submission.language,
                problem.testCases,
                problem.timeLimit,
                problem.memoryLimit
            );

            // Update submission with results
            submission.testResults = judgeResult.testResults;
            submission.status = judgeResult.finalStatus;
            submission.errorDetails = judgeResult.errorDetails;

            await submission.save();

            // Update statistics for user and problem
            await this.updateStatistics(submission, problem);

            console.log(`Submission processed: ${submissionId} -> ${submission.status}`);

        } catch (error) {
            console.error('Process submission error:', error);
            
            // Update submission status to system error
            try {
                await Submission.findByIdAndUpdate(submissionId, {
                    status: 'System Error',
                    errorDetails: 'Internal processing error occurred'
                });
            } catch (updateError) {
                console.error('Failed to update submission error status:', updateError);
            }
        }
    }

    // Update user and problem statistics
    static async updateStatistics(submission, problem) {
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

            console.log(`Statistics updated for submission: ${submission._id}`);

        } catch (error) {
            console.error('Update statistics error:', error);
        }
    }

    // Get submission analytics for admin
    static async getSubmissionAnalytics(req, res) {
        try {
            const {
                startDate,
                endDate,
                problemId,
                userId,
                groupBy = 'day'
            } = req.query;

            const matchConditions = {};
            
            if (startDate || endDate) {
                matchConditions.submittedAt = {};
                if (startDate) matchConditions.submittedAt.$gte = new Date(startDate);
                if (endDate) matchConditions.submittedAt.$lte = new Date(endDate);
            }
            
            if (problemId) matchConditions.problemId = problemId;
            if (userId) matchConditions.userId = userId;

            // Aggregation pipeline for analytics
            const pipeline = [
                { $match: matchConditions },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: groupBy === 'hour' ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d',
                                date: '$submittedAt'
                            }
                        },
                        totalSubmissions: { $sum: 1 },
                        acceptedSubmissions: {
                            $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
                        },
                        languageDistribution: { $push: '$language' },
                        statusDistribution: { $push: '$status' }
                    }
                },
                { $sort: { '_id': 1 } }
            ];

            const analytics = await Submission.aggregate(pipeline);

            res.json({
                success: true,
                data: analytics
            });

        } catch (error) {
            console.error('Get submission analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching submission analytics'
            });
        }
    }
}

module.exports = SubmissionController;
