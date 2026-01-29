const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Hint = require('../models/Hint');

class ProblemController {
    // Get all problems with filtering and pagination
    static async getAllProblems(req, res) {
        try {
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
                .select('-testCases -hints') // Don't include sensitive data
                .sort({ [sortBy]: sortDirection })
                .limit(parseInt(limit))
                .skip(skip)
                .populate('createdBy', 'fullName username');

            // Get total count for pagination
            const totalProblems = await Problem.countDocuments(query);
            const totalPages = Math.ceil(totalProblems / limit);

            // Get user's solved problems
            const userSolvedProblems = req.user.solvedProblems.map(sp => sp.problemId.toString());

            // Add solved status and acceptance rate to each problem
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
    }

    // Get a specific problem by ID
    static async getProblemById(req, res) {
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

            // Get user's submissions for this problem (last 5)
            const userSubmissions = await Submission.find({
                userId: req.user._id,
                problemId: problem._id
            })
            .select('status submittedAt language metrics')
            .sort({ submittedAt: -1 })
            .limit(5);

            // Get hints for this problem
            const hints = await Hint.getProblemHints(problem._id);

            res.json({
                success: true,
                data: {
                    ...problem.toObject(),
                    solved: userSolved,
                    acceptanceRate: problem.acceptanceRate,
                    userSubmissions,
                    hints: hints.map(hint => ({
                        id: hint._id,
                        level: hint.level,
                        category: hint.category,
                        unlockCost: hint.unlockCost
                    }))
                }
            });

        } catch (error) {
            console.error('Get problem error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching problem'
            });
        }
    }

    // Create a new problem (Admin only)
    static async createProblem(req, res) {
        try {
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
                starterCode = {},
                timeLimit = 2000,
                memoryLimit = 256
            } = req.body;

            // Check if problem with same title exists
            const existingProblem = await Problem.findOne({ 
                title: { $regex: `^${title}$`, $options: 'i' }
            });
            
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
                tags: tags.map(tag => tag.toLowerCase()),
                starterCode,
                timeLimit,
                memoryLimit,
                createdBy: req.user._id
            });

            await newProblem.save();

            // Create hints if provided
            if (hints && hints.length > 0) {
                const hintPromises = hints.map((hint, index) => {
                    const newHint = new Hint({
                        problemId: newProblem._id,
                        content: hint.content,
                        level: hint.level || (index + 1),
                        category: hint.category || 'approach',
                        unlockCost: hint.unlockCost || 0,
                        createdBy: req.user._id
                    });
                    return newHint.save();
                });

                await Promise.all(hintPromises);
            }

            console.log(`New problem created: ${title} by ${req.user.username}`);

            res.status(201).json({
                success: true,
                message: 'Problem created successfully',
                data: {
                    id: newProblem._id,
                    title: newProblem.title,
                    difficulty: newProblem.difficulty,
                    category: newProblem.category
                }
            });

        } catch (error) {
            console.error('Create problem error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while creating problem'
            });
        }
    }

    // Update a problem (Admin only)
    static async updateProblem(req, res) {
        try {
            const problem = await Problem.findById(req.params.id);
            
            if (!problem) {
                return res.status(404).json({
                    success: false,
                    message: 'Problem not found'
                });
            }

            // Update allowed fields
            const updateFields = [
                'title', 'description', 'difficulty', 'category', 
                'examples', 'constraints', 'tags', 'starterCode',
                'timeLimit', 'memoryLimit'
            ];

            updateFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    if (field === 'tags' && Array.isArray(req.body[field])) {
                        problem[field] = req.body[field].map(tag => tag.toLowerCase());
                    } else {
                        problem[field] = req.body[field];
                    }
                }
            });

            await problem.save();

            console.log(`Problem updated: ${problem.title} by ${req.user.username}`);

            res.json({
                success: true,
                message: 'Problem updated successfully',
                data: {
                    id: problem._id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    category: problem.category,
                    updatedAt: problem.updatedAt
                }
            });

        } catch (error) {
            console.error('Update problem error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while updating problem'
            });
        }
    }

    // Delete a problem (Admin only) - Soft delete
    static async deleteProblem(req, res) {
        try {
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

            console.log(`Problem deleted: ${problem.title} by ${req.user.username}`);

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
    }

    // Get problem statistics
    static async getProblemStats(req, res) {
        try {
            const problemId = req.params.id;
            
            const problem = await Problem.findOne({
                _id: problemId,
                isActive: true
            }).select('statistics title difficulty');

            if (!problem) {
                return res.status(404).json({
                    success: false,
                    message: 'Problem not found'
                });
            }

            // Get detailed submission statistics
            const submissionStats = await Submission.aggregate([
                { $match: { problemId: problem._id } },
                {
                    $group: {
                        _id: null,
                        totalSubmissions: { $sum: 1 },
                        acceptedSubmissions: { 
                            $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
                        },
                        statusDistribution: { $push: '$status' },
                        languageDistribution: { $push: '$language' },
                        avgExecutionTime: { 
                            $avg: { $cond: [{ $eq: ['$status', 'Accepted'] }, '$metrics.executionTime', null] }
                        }
                    }
                }
            ]);

            const stats = submissionStats[0] || {};

            // Process distributions
            const statusCount = {};
            (stats.statusDistribution || []).forEach(status => {
                statusCount[status] = (statusCount[status] || 0) + 1;
            });

            const languageCount = {};
            (stats.languageDistribution || []).forEach(lang => {
                languageCount[lang] = (languageCount[lang] || 0) + 1;
            });

            res.json({
                success: true,
                data: {
                    problemInfo: {
                        id: problem._id,
                        title: problem.title,
                        difficulty: problem.difficulty
                    },
                    statistics: {
                        ...problem.statistics.toObject(),
                        acceptanceRate: problem.acceptanceRate,
                        avgExecutionTime: Math.round(stats.avgExecutionTime || 0),
                        statusDistribution: statusCount,
                        languageDistribution: languageCount
                    }
                }
            });

        } catch (error) {
            console.error('Get problem stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching problem statistics'
            });
        }
    }

    // Get recommended problems for user
    static async getRecommendations(req, res) {
        try {
            const { limit = 5, difficulty } = req.query;
            
            // Get user's solved problems to exclude them
            const solvedProblemIds = req.user.solvedProblems.map(sp => sp.problemId);
            
            const query = { 
                isActive: true,
                _id: { $nin: solvedProblemIds }
            };
            
            if (difficulty) query.difficulty = difficulty;

            // For now, return random problems (in production, implement ML-based recommendations)
            const recommendations = await Problem.aggregate([
                { $match: query },
                { $sample: { size: parseInt(limit) } },
                {
                    $project: {
                        title: 1,
                        difficulty: 1,
                        category: 1,
                        'statistics.solvedBy': 1,
                        acceptanceRate: {
                            $cond: [
                                { $eq: ['$statistics.totalSubmissions', 0] },
                                0,
                                {
                                    $round: [
                                        {
                                            $multiply: [
                                                { $divide: ['$statistics.acceptedSubmissions', '$statistics.totalSubmissions'] },
                                                100
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            ]);

            res.json({
                success: true,
                data: recommendations
            });

        } catch (error) {
            console.error('Get recommendations error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching recommendations'
            });
        }
    }
}

module.exports = ProblemController;
