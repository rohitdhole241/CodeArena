const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

class AdminController {
    // Get admin dashboard statistics
    static async getDashboardStats(req, res) {
        try {
            // Get basic counts
            const [totalUsers, totalProblems, totalSubmissions] = await Promise.all([
                User.countDocuments({ isActive: true }),
                Problem.countDocuments({ isActive: true }),
                Submission.countDocuments()
            ]);

            // Get submission statistics for success rate
            const submissionStats = await Submission.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSubmissions: { $sum: 1 },
                        acceptedSubmissions: { 
                            $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
                        },
                        statusDistribution: { $push: '$status' },
                        languageDistribution: { $push: '$language' }
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

            // Get recent submissions (last 10)
            const recentSubmissions = await Submission.find()
                .populate('userId', 'fullName username')
                .populate('problemId', 'title difficulty')
                .select('status language submittedAt metrics')
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

            // Get user registration trends (last 12 months)
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const userGrowth = await User.aggregate([
                { $match: { createdAt: { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        newUsers: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Get top performing users
            const topUsers = await User.find({ isActive: true })
                .select('fullName username profileStats')
                .sort({ 'profileStats.problemsSolved': -1 })
                .limit(5);

            // Get most popular problems
            const popularProblems = await Problem.find({ isActive: true })
                .select('title difficulty statistics')
                .sort({ 'statistics.totalSubmissions': -1 })
                .limit(5);

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
                    trends: {
                        userGrowth
                    },
                    topPerformers: {
                        users: topUsers,
                        problems: popularProblems
                    },
                    recentActivity: recentSubmissions
                }
            });

        } catch (error) {
            console.error('Get admin dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching admin dashboard'
            });
        }
    }

    // Get system health and performance metrics
    static async getSystemHealth(req, res) {
        try {
            // Database connection status
            const mongoose = require('mongoose');
            const dbStatus = mongoose.connection.readyState;
            const dbStatusText = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbStatus];

            // Memory usage
            const memoryUsage = process.memoryUsage();
            const memoryInfo = {
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                external: Math.round(memoryUsage.external / 1024 / 1024) // MB
            };

            // Uptime
            const uptime = Math.floor(process.uptime());
            const uptimeFormatted = {
                days: Math.floor(uptime / 86400),
                hours: Math.floor((uptime % 86400) / 3600),
                minutes: Math.floor((uptime % 3600) / 60),
                seconds: uptime % 60
            };

            // Recent error logs (if logging system is implemented)
            const recentErrors = []; // Placeholder for error logging system

            // Submission queue status (pending submissions)
            const pendingSubmissions = await Submission.countDocuments({ 
                status: { $in: ['Pending', 'Running'] }
            });

            // Average response times (placeholder - would need actual monitoring)
            const performanceMetrics = {
                avgResponseTime: Math.floor(Math.random() * 100) + 50, // ms
                avgJudgeTime: Math.floor(Math.random() * 2000) + 500, // ms
                activeConnections: Math.floor(Math.random() * 50) + 10
            };

            res.json({
                success: true,
                data: {
                    database: {
                        status: dbStatusText,
                        connected: dbStatus === 1
                    },
                    server: {
                        uptime: uptimeFormatted,
                        memory: memoryInfo,
                        nodeVersion: process.version,
                        platform: process.platform
                    },
                    queue: {
                        pendingSubmissions
                    },
                    performance: performanceMetrics,
                    errors: recentErrors
                }
            });

        } catch (error) {
            console.error('Get system health error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching system health'
            });
        }
    }

    // Get detailed analytics
    static async getAnalytics(req, res) {
        try {
            const { period = '30d', metric = 'submissions' } = req.query;
            
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            
            switch (period) {
                case '7d':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(startDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(startDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 30);
            }

            let analytics = {};

            switch (metric) {
                case 'submissions':
                    analytics = await this.getSubmissionAnalytics(startDate, endDate);
                    break;
                case 'users':
                    analytics = await this.getUserAnalytics(startDate, endDate);
                    break;
                case 'problems':
                    analytics = await this.getProblemAnalytics(startDate, endDate);
                    break;
                default:
                    analytics = await this.getSubmissionAnalytics(startDate, endDate);
            }

            res.json({
                success: true,
                data: {
                    period,
                    metric,
                    dateRange: { startDate, endDate },
                    analytics
                }
            });

        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching analytics'
            });
        }
    }

    // Helper method for submission analytics
    static async getSubmissionAnalytics(startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    submittedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$submittedAt'
                        }
                    },
                    totalSubmissions: { $sum: 1 },
                    acceptedSubmissions: {
                        $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
                    },
                    languages: { $push: '$language' }
                }
            },
            { $sort: { '_id': 1 } }
        ];

        return await Submission.aggregate(pipeline);
    }

    // Helper method for user analytics
    static async getUserAnalytics(startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    newUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    }
                }
            },
            { $sort: { '_id': 1 } }
        ];

        return await User.aggregate(pipeline);
    }

    // Helper method for problem analytics
    static async getProblemAnalytics(startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    newProblems: { $sum: 1 },
                    difficulties: { $push: '$difficulty' },
                    categories: { $push: '$category' }
                }
            },
            { $sort: { '_id': 1 } }
        ];

        return await Problem.aggregate(pipeline);
    }

    // Bulk operations for admin
    static async bulkUpdateUsers(req, res) {
        try {
            const { userIds, updates } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required'
                });
            }

            const allowedUpdates = ['isActive', 'role'];
            const updateData = {};

            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updateData[key] = updates[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid update fields provided'
                });
            }

            const result = await User.updateMany(
                { _id: { $in: userIds } },
                { $set: updateData }
            );

            console.log(`Bulk user update by ${req.user.username}: ${result.modifiedCount} users affected`);

            res.json({
                success: true,
                message: `Successfully updated ${result.modifiedCount} users`,
                data: {
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount
                }
            });

        } catch (error) {
            console.error('Bulk update users error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during bulk user update'
            });
        }
    }

    // Export data for admin
    static async exportData(req, res) {
        try {
            const { type, format = 'json', startDate, endDate } = req.query;

            let data = [];
            let filename = '';

            const dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);

            switch (type) {
                case 'users':
                    const userQuery = {};
                    if (Object.keys(dateFilter).length > 0) {
                        userQuery.createdAt = dateFilter;
                    }
                    
                    data = await User.find(userQuery)
                        .select('fullName username email role profileStats isActive createdAt')
                        .lean();
                    filename = `users_export_${Date.now()}`;
                    break;

                case 'submissions':
                    const submissionQuery = {};
                    if (Object.keys(dateFilter).length > 0) {
                        submissionQuery.submittedAt = dateFilter;
                    }
                    
                    data = await Submission.find(submissionQuery)
                        .populate('userId', 'username fullName')
                        .populate('problemId', 'title difficulty')
                        .select('status language metrics submittedAt')
                        .lean();
                    filename = `submissions_export_${Date.now()}`;
                    break;

                case 'problems':
                    const problemQuery = { isActive: true };
                    if (Object.keys(dateFilter).length > 0) {
                        problemQuery.createdAt = dateFilter;
                    }
                    
                    data = await Problem.find(problemQuery)
                        .populate('createdBy', 'username fullName')
                        .select('title difficulty category statistics createdAt')
                        .lean();
                    filename = `problems_export_${Date.now()}`;
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid export type. Use: users, submissions, or problems'
                    });
            }

            if (format === 'csv') {
                // Convert to CSV (basic implementation)
                const csv = this.convertToCSV(data);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
                res.send(csv);
            } else {
                // JSON format
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
                res.json({
                    success: true,
                    exportType: type,
                    recordCount: data.length,
                    exportedAt: new Date().toISOString(),
                    data
                });
            }

            console.log(`Data export by ${req.user.username}: ${type} (${data.length} records)`);

        } catch (error) {
            console.error('Export data error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during data export'
            });
        }
    }

    // Helper method to convert JSON to CSV
    static convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }
}

module.exports = AdminController;
