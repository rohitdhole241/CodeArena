const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');

class RecommendationEngine {
    // Get personalized problem recommendations for a user
    static async getRecommendationsForUser(userId, limit = 5) {
        try {
            const user = await User.findById(userId).populate('solvedProblems.problemId');
            if (!user) {
                throw new Error('User not found');
            }

            // Get user's solved problems and preferences
            const solvedProblemIds = user.solvedProblems.map(sp => sp.problemId._id);
            const userPreferences = this.analyzeUserPreferences(user);

            // Get candidate problems (unsolved by user)
            const candidateProblems = await Problem.find({
                isActive: true,
                _id: { $nin: solvedProblemIds }
            });

            // Score and rank problems
            const scoredProblems = await this.scoreProblems(candidateProblems, user, userPreferences);

            // Sort by score and return top recommendations
            return scoredProblems
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(item => ({
                    problem: item.problem,
                    score: item.score,
                    reasons: item.reasons
                }));

        } catch (error) {
            console.error('Get recommendations error:', error);
            return [];
        }
    }

    // Analyze user preferences based on solving history
    static analyzeUserPreferences(user) {
        const preferences = {
            difficultiesPreferred: {},
            categoriesPreferred: {},
            averageDifficulty: 0,
            skillLevel: 'beginner'
        };

        if (!user.solvedProblems || user.solvedProblems.length === 0) {
            return preferences;
        }

        // Analyze difficulty distribution
        user.solvedProblems.forEach(solved => {
            const difficulty = solved.problemId.difficulty;
            preferences.difficultiesPreferred[difficulty] = 
                (preferences.difficultiesPreferred[difficulty] || 0) + 1;
        });

        // Analyze category distribution
        user.solvedProblems.forEach(solved => {
            const category = solved.problemId.category;
            preferences.categoriesPreferred[category] = 
                (preferences.categoriesPreferred[category] || 0) + 1;
        });

        // Determine skill level
        const totalSolved = user.solvedProblems.length;
        const hardSolved = preferences.difficultiesPreferred['Hard'] || 0;
        const mediumSolved = preferences.difficultiesPreferred['Medium'] || 0;

        if (totalSolved >= 50 && hardSolved >= 10) {
            preferences.skillLevel = 'advanced';
        } else if (totalSolved >= 20 && mediumSolved >= 5) {
            preferences.skillLevel = 'intermediate';
        }

        return preferences;
    }

    // Score problems based on user preferences and various factors
    static async scoreProblems(problems, user, preferences) {
        const scoredProblems = [];

        for (const problem of problems) {
            let score = 0;
            const reasons = [];

            // Difficulty scoring
            const difficultyScore = this.getDifficultyScore(problem.difficulty, preferences, user);
            score += difficultyScore.score;
            if (difficultyScore.reason) reasons.push(difficultyScore.reason);

            // Category scoring
            const categoryScore = this.getCategoryScore(problem.category, preferences);
            score += categoryScore.score;
            if (categoryScore.reason) reasons.push(categoryScore.reason);

            // Popularity scoring (problems solved by similar users)
            const popularityScore = this.getPopularityScore(problem);
            score += popularityScore.score;
            if (popularityScore.reason) reasons.push(popularityScore.reason);

            // Freshness scoring (newer problems get slight boost)
            const freshnessScore = this.getFreshnessScore(problem);
            score += freshnessScore.score;

            // Success rate scoring (problems with reasonable success rate)
            const successRateScore = this.getSuccessRateScore(problem);
            score += successRateScore.score;

            scoredProblems.push({
                problem: {
                    id: problem._id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    category: problem.category,
                    statistics: problem.statistics,
                    acceptanceRate: problem.acceptanceRate
                },
                score: Math.round(score * 100) / 100,
                reasons
            });
        }

        return scoredProblems;
    }

    // Get difficulty-based score
    static getDifficultyScore(difficulty, preferences, user) {
        const skillLevel = preferences.skillLevel;
        let score = 0;
        let reason = '';

        // Base scoring by skill level
        if (skillLevel === 'beginner') {
            if (difficulty === 'Easy') {
                score = 0.4;
                reason = 'Good for building fundamentals';
            } else if (difficulty === 'Medium') {
                score = 0.1;
                reason = 'Challenging but achievable';
            } else {
                score = -0.2;
            }
        } else if (skillLevel === 'intermediate') {
            if (difficulty === 'Easy') {
                score = 0.2;
            } else if (difficulty === 'Medium') {
                score = 0.4;
                reason = 'Perfect difficulty match';
            } else {
                score = 0.2;
                reason = 'Great challenge to grow';
            }
        } else { // advanced
            if (difficulty === 'Easy') {
                score = 0.1;
            } else if (difficulty === 'Medium') {
                score = 0.3;
            } else {
                score = 0.4;
                reason = 'Advanced level challenge';
            }
        }

        // Boost if user has solved problems of this difficulty before
        if (preferences.difficultiesPreferred[difficulty]) {
            score += 0.1;
            if (!reason) reason = 'Similar to problems you\'ve solved';
        }

        return { score, reason };
    }

    // Get category-based score
    static getCategoryScore(category, preferences) {
        let score = 0;
        let reason = '';

        // If user has solved problems in this category, give it a boost
        const categoryCount = preferences.categoriesPreferred[category] || 0;
        
        if (categoryCount > 0) {
            score = 0.2;
            if (categoryCount >= 3) {
                reason = `You excel in ${category} problems`;
            } else {
                reason = `Continue practicing ${category}`;
            }
        } else {
            score = 0.1;
            reason = `Explore new topic: ${category}`;
        }

        return { score, reason };
    }

    // Get popularity-based score
    static getPopularityScore(problem) {
        const solvedBy = problem.statistics.solvedBy || 0;
        let score = 0;
        let reason = '';

        if (solvedBy >= 1000) {
            score = 0.2;
            reason = 'Popular problem - great for practice';
        } else if (solvedBy >= 500) {
            score = 0.15;
            reason = 'Well-practiced problem';
        } else if (solvedBy >= 100) {
            score = 0.1;
        } else {
            score = 0.05;
        }

        return { score, reason };
    }

    // Get freshness-based score
    static getFreshnessScore(problem) {
        const daysSinceCreated = (Date.now() - problem.createdAt) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCreated <= 30) {
            return { score: 0.1 }; // Slight boost for new problems
        }
        
        return { score: 0 };
    }

    // Get success rate-based score
    static getSuccessRateScore(problem) {
        const acceptanceRate = problem.acceptanceRate || 0;
        
        if (acceptanceRate >= 70) {
            return { score: 0.1 }; // Slightly easier problems
        } else if (acceptanceRate >= 40) {
            return { score: 0.15 }; // Good balance
        } else if (acceptanceRate >= 20) {
            return { score: 0.1 }; // Challenging but fair
        }
        
        return { score: 0.05 }; // Very challenging problems
    }

    // Get similar users for collaborative filtering
    static async getSimilarUsers(userId, limit = 10) {
        try {
            const user = await User.findById(userId).populate('solvedProblems.problemId');
            if (!user) return [];

            const userSolvedIds = user.solvedProblems.map(sp => sp.problemId._id.toString());

            // Find users with similar solving patterns
            const similarUsers = await User.find({
                _id: { $ne: userId },
                'profileStats.problemsSolved': { $gte: Math.max(1, user.profileStats.problemsSolved - 10) },
                isActive: true
            })
            .populate('solvedProblems.problemId')
            .limit(50);

            // Calculate similarity scores
            const similarityScores = similarUsers.map(otherUser => {
                const otherSolvedIds = otherUser.solvedProblems.map(sp => sp.problemId._id.toString());
                
                const intersection = userSolvedIds.filter(id => otherSolvedIds.includes(id));
                const union = [...new Set([...userSolvedIds, ...otherSolvedIds])];
                
                const jaccard = union.length > 0 ? intersection.length / union.length : 0;
                
                return {
                    user: otherUser,
                    similarity: jaccard
                };
            });

            return similarityScores
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

        } catch (error) {
            console.error('Get similar users error:', error);
            return [];
        }
    }

    // Get trending problems
    static async getTrendingProblems(limit = 10) {
        try {
            // Problems with high recent submission activity
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const trending = await Submission.aggregate([
                {
                    $match: {
                        submittedAt: { $gte: oneWeekAgo }
                    }
                },
                {
                    $group: {
                        _id: '$problemId',
                        recentSubmissions: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' }
                    }
                },
                {
                    $project: {
                        problemId: '$_id',
                        recentSubmissions: 1,
                        uniqueUsers: { $size: '$uniqueUsers' }
                    }
                },
                { $sort: { recentSubmissions: -1, uniqueUsers: -1 } },
                { $limit: limit }
            ]);

            // Populate problem details
            const trendingWithDetails = await Problem.populate(trending, {
                path: 'problemId',
                select: 'title difficulty category statistics'
            });

            return trendingWithDetails
                .filter(item => item.problemId && item.problemId.isActive)
                .map(item => ({
                    problem: item.problemId,
                    recentSubmissions: item.recentSubmissions,
                    uniqueUsers: item.uniqueUsers
                }));

        } catch (error) {
            console.error('Get trending problems error:', error);
            return [];
        }
    }

    // Get recommended problems for practice by topic
    static async getTopicRecommendations(category, difficulty = null, limit = 10) {
        try {
            const query = {
                isActive: true,
                category: category
            };

            if (difficulty) {
                query.difficulty = difficulty;
            }

            const problems = await Problem.find(query)
                .sort({ 'statistics.solvedBy': -1, 'statistics.acceptedSubmissions': -1 })
                .limit(limit);

            return problems.map(problem => ({
                id: problem._id,
                title: problem.title,
                difficulty: problem.difficulty,
                category: problem.category,
                acceptanceRate: problem.acceptanceRate,
                solvedBy: problem.statistics.solvedBy
            }));

        } catch (error) {
            console.error('Get topic recommendations error:', error);
            return [];
        }
    }
}

module.exports = RecommendationEngine;
