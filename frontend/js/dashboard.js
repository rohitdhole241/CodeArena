// Dashboard functionality - COMPLETE ENHANCED VERSION
class Dashboard {
    static init() {
        console.log('📊 Dashboard initializing...');
        
        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = '/login';
            return;
        }

        // Load and update all dashboard components
        this.loadUserProfile();
        this.updateWelcomeMessage();
        this.loadAndCalculateUserStats();
        this.bindEventListeners();
        
        // Auto-refresh stats every 30 seconds
        setInterval(() => {
            this.loadAndCalculateUserStats();
        }, 30000);
        
        console.log('✅ Dashboard initialization complete');
    }

    static checkAuth() {
        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            console.log('❌ No authentication found, redirecting to login');
            return false;
        }
        
        console.log('✅ User authenticated:', userId);
        return true;
    }

    static updateWelcomeMessage() {
        const fullName = localStorage.getItem('userFullName');
        const username = localStorage.getItem('username');
        const userRole = localStorage.getItem('userRole');
        
        const userFullNameEl = document.getElementById('userFullName');
        const welcomeSubtext = document.getElementById('welcomeSubtext');
        
        if (fullName) {
            // Extract first name from full name
            const firstName = fullName.split(' ')[0];
            if (userFullNameEl) {
                userFullNameEl.textContent = firstName;
            }
            console.log('👤 Welcome message updated for:', firstName);
        } else if (username) {
            if (userFullNameEl) {
                userFullNameEl.textContent = username;
            }
            console.log('👤 Welcome message updated for username:', username);
        } else {
            if (userFullNameEl) {
                userFullNameEl.textContent = 'User';
            }
        }

        // Update subtext based on role
        if (welcomeSubtext) {
            if (userRole === 'admin') {
                welcomeSubtext.textContent = 'Manage your platform and monitor progress';
            } else {
                welcomeSubtext.textContent = 'Track your progress and continue your coding journey';
            }
        }
    }

    static loadAndCalculateUserStats() {
        console.log('📊 Calculating user statistics from submissions...');
        
        try {
            // Load submissions from localStorage
            const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
            console.log(`📄 Found ${submissions.length} submissions`);
            
            // Calculate statistics from actual submissions
            const stats = this.calculateStatsFromSubmissions(submissions);
            
            // Update localStorage with calculated stats
            this.updateLocalStorageStats(stats);
            
            // Update UI with calculated stats
            this.updateStatsUI(stats);
            
            // Update progress indicators
            this.updateProgressIndicators(stats, submissions);
            
            // Update recent activity
            this.updateRecentActivity(submissions);
            
            console.log('📊 Stats calculated and updated:', stats);
            
        } catch (error) {
            console.error('❌ Error calculating stats:', error);
            // Fallback to default stats
            const defaultStats = {
                problemsSolved: 0,
                totalSubmissions: 0,
                acceptedSubmissions: 0,
                currentStreak: 0,
                accuracyRate: 0
            };
            this.updateStatsUI(defaultStats);
        }
    }

    static calculateStatsFromSubmissions(submissions) {
        if (!submissions || submissions.length === 0) {
            return {
                problemsSolved: 0,
                totalSubmissions: 0,
                acceptedSubmissions: 0,
                currentStreak: 0,
                accuracyRate: 0
            };
        }

        // Total submissions
        const totalSubmissions = submissions.length;
        
        // Accepted submissions
        const acceptedSubmissions = submissions.filter(sub => sub.status === 'Accepted').length;
        
        // Unique problems solved (count each problem only once)
        const solvedProblemIds = new Set(
            submissions
                .filter(sub => sub.status === 'Accepted')
                .map(sub => sub.problemId)
        );
        const problemsSolved = solvedProblemIds.size;
        
        // Calculate accuracy rate
        const accuracyRate = totalSubmissions > 0 ? 
            Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;
        
        // Calculate current streak (consecutive accepted submissions from most recent)
        let currentStreak = 0;
        for (let i = 0; i < submissions.length; i++) {
            if (submissions[i].status === 'Accepted') {
                currentStreak++;
            } else {
                break; // Streak is broken
            }
        }
        
        return {
            problemsSolved,
            totalSubmissions,
            acceptedSubmissions,
            currentStreak,
            accuracyRate
        };
    }

    static updateLocalStorageStats(stats) {
        // Update localStorage with calculated stats
        localStorage.setItem('problemsSolved', stats.problemsSolved.toString());
        localStorage.setItem('totalSubmissions', stats.totalSubmissions.toString());
        localStorage.setItem('acceptedSubmissions', stats.acceptedSubmissions.toString());
        localStorage.setItem('currentStreak', stats.currentStreak.toString());
        
        console.log('💾 Updated localStorage with calculated stats');
    }

    static updateStatsUI(stats) {
        // Update UI elements with animation
        this.animateStatUpdate('problemsSolved', stats.problemsSolved);
        this.animateStatUpdate('totalSubmissions', stats.totalSubmissions);
        this.animateStatUpdate('currentStreak', stats.currentStreak);
        this.animateStatUpdate('accuracyRate', stats.accuracyRate + '%');
        
        console.log('🎨 UI updated with stats:', stats);
    }

    static updateProgressIndicators(stats, submissions) {
        // Update progress overview
        const progressProblems = document.getElementById('progressProblems');
        const progressBar = document.getElementById('progressBar');
        
        if (progressProblems) {
            progressProblems.textContent = `${stats.problemsSolved}/100`;
        }
        
        if (progressBar) {
            const percentage = Math.min((stats.problemsSolved / 100) * 100, 100);
            progressBar.style.width = percentage + '%';
        }

        // Update difficulty counts
        const difficultyStats = this.calculateDifficultyStats(submissions);
        
        const easyCount = document.getElementById('easyCount');
        const mediumCount = document.getElementById('mediumCount');
        const hardCount = document.getElementById('hardCount');
        
        if (easyCount) easyCount.textContent = difficultyStats.easy;
        if (mediumCount) mediumCount.textContent = difficultyStats.medium;
        if (hardCount) hardCount.textContent = difficultyStats.hard;
    }

    static calculateDifficultyStats(submissions) {
        const solvedByDifficulty = {
            easy: new Set(),
            medium: new Set(),
            hard: new Set()
        };

        submissions
            .filter(sub => sub.status === 'Accepted')
            .forEach(sub => {
                if (sub.problemDifficulty) {
                    const difficulty = sub.problemDifficulty.toLowerCase();
                    if (solvedByDifficulty[difficulty]) {
                        solvedByDifficulty[difficulty].add(sub.problemId);
                    }
                }
            });

        return {
            easy: solvedByDifficulty.easy.size,
            medium: solvedByDifficulty.medium.size,
            hard: solvedByDifficulty.hard.size
        };
    }

    static updateRecentActivity(submissions) {
        const recentActivityEl = document.getElementById('recentActivity');
        if (!recentActivityEl || submissions.length === 0) return;

        // Get last 3 submissions
        const recentSubmissions = submissions.slice(0, 3);
        
        const activityHtml = recentSubmissions.map(submission => {
            const submittedDate = new Date(submission.submittedAt);
            const timeAgo = this.getTimeAgo(submittedDate);
            const isAccepted = submission.status === 'Accepted';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${isAccepted ? '#28a745' : '#dc3545'}; color: white;">
                        ${isAccepted ? '✓' : '✗'}
                    </div>
                    <div>
                        <h4 style="margin: 0; color: #333;">${submission.problemTitle || 'Problem'}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            ${isAccepted ? 'Solved' : 'Failed'} • ${submission.problemDifficulty || 'Unknown'} • ${timeAgo}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
        
        recentActivityEl.innerHTML = activityHtml + `
            <div style="text-align: center; margin-top: 1rem;">
                <button onclick="window.location.href='submissions.html'" 
                        style="background: none; border: none; color: #667eea; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; transition: background 0.3s ease;">
                    View All Activity →
                </button>
            </div>
        `;
    }

    static getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }

    static animateStatUpdate(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element ${elementId} not found`);
            return;
        }

        const currentValue = parseInt(element.textContent) || 0;
        
        // Handle percentage values
        if (typeof targetValue === 'string' && targetValue.includes('%')) {
            element.textContent = targetValue;
            this.addUpdateAnimation(element);
            return;
        }

        const target = parseInt(targetValue) || 0;
        
        // If no change needed, just ensure it's set correctly
        if (currentValue === target) {
            element.textContent = target;
            return;
        }

        // Animate the number counting up or down
        const duration = 1000; // 1 second animation
        const steps = 20;
        const stepTime = duration / steps;
        const increment = (target - currentValue) / steps;
        let current = currentValue;

        const animation = setInterval(() => {
            current += increment;
            
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                current = target;
                clearInterval(animation);
            }
            
            element.textContent = Math.round(current);
        }, stepTime);

        // Add visual feedback
        this.addUpdateAnimation(element);
    }

    static addUpdateAnimation(element) {
        // Add a brief highlight animation
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.3s ease';
        element.style.color = '#667eea';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '#333';
        }, 300);
    }

    static async loadUserProfile() {
        try {
            const token = localStorage.getItem('authToken');
            
            // If we don't have user details in localStorage, try to fetch from server
            const fullName = localStorage.getItem('userFullName');
            if (!fullName && token) {
                console.log('🔄 Fetching user profile from server...');
                
                try {
                    const response = await fetch('/api/auth/profile', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.user) {
                            // Update localStorage with fresh user data
                            localStorage.setItem('userFullName', data.user.fullName);
                            localStorage.setItem('username', data.user.username);
                            localStorage.setItem('userRole', data.user.role);
                            
                            console.log('✅ User profile updated from server');
                            this.updateWelcomeMessage();
                        }
                    }
                } catch (serverError) {
                    console.log('⚠️ Server profile fetch failed:', serverError.message);
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    static bindEventListeners() {
        console.log('📡 Binding dashboard event listeners...');
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Refresh stats button
        const refreshStatsBtn = document.getElementById('refreshStats');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => {
                console.log('🔄 Manual stats refresh triggered');
                refreshStatsBtn.disabled = true;
                refreshStatsBtn.innerHTML = '🔄 Refreshing...';
                
                this.loadAndCalculateUserStats();
                this.showToast('Statistics refreshed!', 'success');
                
                setTimeout(() => {
                    refreshStatsBtn.disabled = false;
                    refreshStatsBtn.innerHTML = '🔄 Refresh Stats';
                }, 1000);
            });
        }

        // Update stats when page becomes visible (if user submits in another tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Page became visible, refreshing stats...');
                this.loadAndCalculateUserStats();
            }
        });

        // Listen for storage changes (if user submits in another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'submissions') {
                console.log('🔄 Submissions updated in another tab, refreshing stats...');
                this.loadAndCalculateUserStats();
            }
        });

        console.log('✅ Event listeners bound successfully');
    }

    static handleLogout() {
        console.log('👋 User logout initiated');
        
        if (confirm('Are you sure you want to logout?')) {
            // Clear all stored user data
            const keysToRemove = [
                'authToken', 'userId', 'userFullName', 'username', 'userRole',
                'problemsSolved', 'totalSubmissions', 'acceptedSubmissions', 'currentStreak'
            ];
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            console.log('🧹 Local storage cleared');
            
            // Show logout message and redirect
            this.showToast('Logged out successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    }

    static showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Public method to update stats (called from other pages)
    static updateStatsAfterSubmission(isAccepted = false) {
        console.log('📊 Updating stats after submission:', isAccepted ? 'ACCEPTED' : 'FAILED');
        
        // Recalculate all stats from submissions
        this.loadAndCalculateUserStats();
        
        // Show feedback
        if (isAccepted) {
            this.showToast('Problem solved! Stats updated.', 'success');
        } else {
            this.showToast('Submission recorded.', 'info');
        }
    }

    // Method to manually refresh all data
    static refreshDashboard() {
        console.log('🔄 Refreshing entire dashboard...');
        
        this.updateWelcomeMessage();
        this.loadUserProfile();
        this.loadAndCalculateUserStats();
        
        this.showToast('Dashboard refreshed!', 'success');
    }

    // Method to create test submissions for demonstration
    static createTestSubmissions() {
        console.log('🧪 Creating test submissions...');
        
        const testSubmissions = [
            {
                id: 'test_' + Date.now() + '_1',
                problemId: '1',
                problemTitle: 'Two Sum',
                problemDifficulty: 'Easy',
                problemCategory: 'Array',
                status: 'Accepted',
                language: 'javascript',
                runtime: '68ms',
                memory: '42.1 MB',
                submittedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
                code: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}'
            },
            {
                id: 'test_' + Date.now() + '_2',
                problemId: '5',
                problemTitle: 'Valid Parentheses',
                problemDifficulty: 'Easy',
                problemCategory: 'Stack',
                status: 'Accepted',
                language: 'javascript',
                runtime: '52ms',
                memory: '38.9 MB',
                submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
                code: 'function isValid(s) {\n    const stack = [];\n    const map = { ")": "(", "}": "{", "]": "[" };\n    for (let char of s) {\n        if (char in map) {\n            if (stack.pop() !== map[char]) return false;\n        } else {\n            stack.push(char);\n        }\n    }\n    return stack.length === 0;\n}'
            },
            {
                id: 'test_' + Date.now() + '_3',
                problemId: '3',
                problemTitle: 'Longest Substring Without Repeating Characters',
                problemDifficulty: 'Medium',
                problemCategory: 'String',
                status: 'Wrong Answer',
                language: 'javascript',
                runtime: 'N/A',
                memory: 'N/A',
                submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                code: 'function lengthOfLongestSubstring(s) {\n    // Incomplete solution\n    return 0;\n}'
            },
            {
                id: 'test_' + Date.now() + '_4',
                problemId: '2',
                problemTitle: 'Add Two Numbers',
                problemDifficulty: 'Medium', 
                problemCategory: 'Linked List',
                status: 'Accepted',
                language: 'javascript',
                runtime: '92ms',
                memory: '44.5 MB',
                submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
                code: 'function addTwoNumbers(l1, l2) {\n    // Solution implementation\n    return new ListNode();\n}'
            }
        ];
        
        // Get existing submissions and add test ones
        const existingSubmissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        const allSubmissions = [...testSubmissions, ...existingSubmissions];
        
        localStorage.setItem('submissions', JSON.stringify(allSubmissions));
        
        console.log('✅ Test submissions created');
        
        // Refresh dashboard
        this.loadAndCalculateUserStats();
        this.showToast('Test data created! Check your stats.', 'success');
        
        // Update the button text
        const createTestBtn = document.getElementById('createTestData');
        if (createTestBtn) {
            createTestBtn.textContent = '✅ Test Data Created';
            createTestBtn.disabled = true;
            setTimeout(() => {
                createTestBtn.textContent = '🧪 Create Test Data';
                createTestBtn.disabled = false;
            }, 3000);
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Dashboard page loaded');
    Dashboard.init();
});

// Make Dashboard available globally for other scripts
window.Dashboard = Dashboard;

// Auto-refresh on focus (when user comes back to tab)
window.addEventListener('focus', () => {
    if (typeof Dashboard !== 'undefined') {
        Dashboard.loadAndCalculateUserStats();
    }
});

console.log('✅ Enhanced Dashboard loaded successfully');
