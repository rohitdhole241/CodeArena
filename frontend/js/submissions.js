// Submissions page functionality - COMPLETE ENHANCED VERSION
class Submissions {
    static init() {
        console.log('📊 Submissions page initializing...');
        
        this.allSubmissions = [];
        this.filteredSubmissions = [];
        
        this.bindEventListeners();
        this.loadSubmissions();
        this.updateStats();
    }

    static bindEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.applyFilters.bind(this));
        }

        // Filter functionality
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', this.applyFilters.bind(this));
        }

        const languageFilter = document.getElementById('languageFilter');
        if (languageFilter) {
            languageFilter.addEventListener('change', this.applyFilters.bind(this));
        }

        // Clear filters
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', this.clearAllFilters.bind(this));
        }

        // Modal close
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', this.closeModal.bind(this));
        }

        // Close modal on backdrop click
        const modal = document.getElementById('submissionModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    static loadSubmissions() {
        try {
            console.log('📄 Loading submissions from localStorage...');
            
            // Load from localStorage
            const storedSubmissions = localStorage.getItem('submissions');
            if (storedSubmissions) {
                this.allSubmissions = JSON.parse(storedSubmissions);
                console.log(`✅ Loaded ${this.allSubmissions.length} submissions`);
            } else {
                console.log('📭 No submissions found in localStorage');
                this.allSubmissions = [];
            }

            // If no submissions, create some sample data for demo
            if (this.allSubmissions.length === 0) {
                this.createSampleSubmissions();
            }

            this.filteredSubmissions = [...this.allSubmissions];
            this.renderSubmissions();

        } catch (error) {
            console.error('❌ Error loading submissions:', error);
            this.allSubmissions = [];
            this.filteredSubmissions = [];
            this.renderSubmissions();
        }
    }

    static createSampleSubmissions() {
        console.log('🎭 Creating sample submissions with proper context...');
        
        const sampleSubmissions = [
            {
                id: 'sub_demo_1',
                problemId: '1',
                problemTitle: 'Two Sum',
                problemDifficulty: 'Easy',
                problemCategory: 'Array',
                problemDescription: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target...',
                code: `function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}`,
                language: 'javascript',
                status: 'Accepted',
                runtime: '68ms',
                memory: '42.1 MB',
                testResults: {
                    total: 3,
                    passed: 3,
                    failed: 0,
                    passRate: '100.0%',
                    feedback: 'Excellent! All test cases passed.'
                },
                submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                submittedDate: new Date(Date.now() - 1000 * 60 * 30).toLocaleDateString(),
                submittedTime: new Date(Date.now() - 1000 * 60 * 30).toLocaleTimeString(),
                userId: 'user',
                userFullName: 'Demo User',
                codeLength: 285,
                attemptNumber: 2
            },
            {
                id: 'sub_demo_2',
                problemId: '3',
                problemTitle: 'Longest Substring Without Repeating Characters',
                problemDifficulty: 'Medium',
                problemCategory: 'String',
                problemDescription: 'Given a string s, find the length of the longest substring without repeating characters...',
                code: `def lengthOfLongestSubstring(s):
    char_set = set()
    max_length = 0
    left = 0
    
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
    
    return max_length`,
                language: 'python',
                status: 'Wrong Answer',
                runtime: 'N/A',
                memory: 'N/A',
                testResults: {
                    total: 3,
                    passed: 2,
                    failed: 1,
                    passRate: '66.7%',
                    feedback: 'Good solution, but some edge cases failed.'
                },
                submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                submittedDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleDateString(),
                submittedTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleTimeString(),
                userId: 'user',
                userFullName: 'Demo User',
                codeLength: 312,
                attemptNumber: 1
            },
            {
                id: 'sub_demo_3',
                problemId: '5',
                problemTitle: 'Valid Parentheses',
                problemDifficulty: 'Easy',
                problemCategory: 'Stack',
                problemDescription: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid...',
                code: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    
    for (let char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    
    return stack.length === 0;
}`,
                language: 'javascript',
                status: 'Accepted',
                runtime: '52ms',
                memory: '38.9 MB',
                testResults: {
                    total: 3,
                    passed: 3,
                    failed: 0,
                    passRate: '100.0%',
                    feedback: 'Excellent! All test cases passed.'
                },
                submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
                submittedDate: new Date(Date.now() - 1000 * 60 * 60 * 6).toLocaleDateString(),
                submittedTime: new Date(Date.now() - 1000 * 60 * 60 * 6).toLocaleTimeString(),
                userId: 'user',
                userFullName: 'Demo User',
                codeLength: 198,
                attemptNumber: 1
            }
        ];

        this.allSubmissions = sampleSubmissions;
        localStorage.setItem('submissions', JSON.stringify(sampleSubmissions));
        console.log('✅ Sample submissions created with full context');
    }

    static renderSubmissions() {
        const tableBody = document.getElementById('submissionsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (!tableBody) return;

        if (this.filteredSubmissions.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        const submissionsHtml = this.filteredSubmissions.map(submission => {
            // Handle both new and old submission formats
            const submittedDate = new Date(submission.submittedAt);
            const isValidDate = !isNaN(submittedDate.getTime());
            
            const timeAgo = isValidDate ? this.getTimeAgo(submittedDate) : 'Unknown time';
            const dateString = isValidDate ? submittedDate.toLocaleDateString() : 'Invalid Date';
            const statusClass = this.getStatusClass(submission.status);
            
            // Use proper problem title or fallback
            const problemTitle = submission.problemTitle || submission.problem || 'Unknown Problem';
            const problemId = submission.problemId || 'unknown';
            const runtime = submission.runtime || 'N/A';
            const memory = submission.memory || 'N/A';
            const language = submission.language || 'javascript';
            
            return `
                <tr style="transition: background-color 0.2s ease;">
                    <td>
                        <div style="font-weight: 600; color: #333; margin-bottom: 0.25rem;">
                            ${problemTitle}
                        </div>
                        <div style="font-size: 0.8rem; color: #666; display: flex; gap: 0.5rem; align-items: center;">
                            <span>#${problemId}</span>
                            ${submission.problemDifficulty ? `
                                <span class="difficulty-badge difficulty-${submission.problemDifficulty.toLowerCase()}" 
                                      style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">
                                    ${submission.problemDifficulty}
                                </span>
                            ` : ''}
                            ${submission.problemCategory ? `
                                <span style="background: #e9ecef; color: #495057; padding: 0.1rem 0.4rem; border-radius: 8px; font-size: 0.7rem;">
                                    ${submission.problemCategory}
                                </span>
                            ` : ''}
                        </div>
                        ${submission.attemptNumber ? `
                            <div style="font-size: 0.75rem; color: #888; margin-top: 0.25rem;">
                                Attempt #${submission.attemptNumber}
                            </div>
                        ` : ''}
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${submission.status}</span>
                        ${submission.testResults ? `
                            <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
                                ${submission.testResults.passed}/${submission.testResults.total} tests
                            </div>
                        ` : ''}
                    </td>
                    <td>
                        <span class="language-badge">${language}</span>
                        ${submission.codeLength ? `
                            <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
                                ${submission.codeLength} chars
                            </div>
                        ` : ''}
                    </td>
                    <td style="font-family: monospace; font-size: 0.9rem;">
                        ${runtime}
                    </td>
                    <td style="font-family: monospace; font-size: 0.9rem;">
                        ${memory}
                    </td>
                    <td>
                        <div style="font-size: 0.9rem; font-weight: 500;">${timeAgo}</div>
                        <div style="font-size: 0.75rem; color: #666;">
                            ${dateString}
                        </div>
                        ${submission.submittedTime ? `
                            <div style="font-size: 0.7rem; color: #888;">
                                ${submission.submittedTime}
                            </div>
                        ` : ''}
                    </td>
                    <td>
                        <button class="view-btn" onclick="Submissions.viewSubmission('${submission.id}')"
                                title="View submission details">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = submissionsHtml;
        console.log(`🎨 Rendered ${this.filteredSubmissions.length} submissions with enhanced details`);
    }

    static getStatusClass(status) {
        switch (status) {
            case 'Accepted': return 'status-accepted';
            case 'Wrong Answer': return 'status-wrong-answer';
            case 'Runtime Error': return 'status-runtime-error';
            case 'Time Limit Exceeded': return 'status-time-limit';
            default: return 'status-wrong-answer';
        }
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

    static updateStats() {
        const totalSubmissions = this.allSubmissions.length;
        const acceptedSubmissions = this.allSubmissions.filter(s => s.status === 'Accepted').length;
        const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;
        
        // Get unique solved problems
        const solvedProblems = new Set(
            this.allSubmissions
                .filter(s => s.status === 'Accepted')
                .map(s => s.problemId)
        );

        // Update UI
        this.updateStatElement('totalSubmissions', totalSubmissions);
        this.updateStatElement('acceptedSubmissions', acceptedSubmissions);
        this.updateStatElement('acceptanceRate', acceptanceRate + '%');
        this.updateStatElement('problemsSolved', solvedProblems.size);

        console.log('📊 Stats updated:', {
            totalSubmissions,
            acceptedSubmissions,
            acceptanceRate: acceptanceRate + '%',
            problemsSolved: solvedProblems.size
        });
    }

    static updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    static applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const languageFilter = document.getElementById('languageFilter').value;

        this.filteredSubmissions = this.allSubmissions.filter(submission => {
            const matchesSearch = !searchTerm || 
                submission.problemTitle.toLowerCase().includes(searchTerm);
                
            const matchesStatus = !statusFilter || 
                submission.status === statusFilter;
                
            const matchesLanguage = !languageFilter || 
                submission.language === languageFilter;

            return matchesSearch && matchesStatus && matchesLanguage;
        });

        console.log(`🔍 Filtered to ${this.filteredSubmissions.length} submissions`);
        this.renderSubmissions();
    }

    static clearAllFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('languageFilter').value = '';
        
        this.filteredSubmissions = [...this.allSubmissions];
        this.renderSubmissions();
        
        console.log('🧹 All filters cleared');
    }

    // Enhanced view submission function
    static viewSubmission(submissionId) {
        console.log('👁️ Viewing submission:', submissionId);
        
        const submission = this.allSubmissions.find(s => s.id === submissionId);
        if (!submission) {
            alert('❌ Submission not found');
            return;
        }

        const modal = document.getElementById('submissionModal');
        const modalTitle = document.getElementById('modalTitle');
        const submissionDetails = document.getElementById('submissionDetails');

        if (modalTitle) {
            modalTitle.textContent = `${submission.problemTitle || 'Submission'} - ${submission.status}`;
        }

        if (submissionDetails) {
            const submittedDate = new Date(submission.submittedAt);
            const isValidDate = !isNaN(submittedDate.getTime());
            
            submissionDetails.innerHTML = `
                <div style="margin-bottom: 2rem;">
                    <!-- Problem Information -->
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <h4 style="margin: 0 0 1rem 0; color: #333;">📝 Problem Information</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                            <div>
                                <strong>Title:</strong> ${submission.problemTitle || 'Unknown Problem'}
                            </div>
                            ${submission.problemDifficulty ? `
                                <div>
                                    <strong>Difficulty:</strong> 
                                    <span class="difficulty-badge difficulty-${submission.problemDifficulty.toLowerCase()}">
                                        ${submission.problemDifficulty}
                                    </span>
                                </div>
                            ` : ''}
                            ${submission.problemCategory ? `
                                <div>
                                    <strong>Category:</strong> ${submission.problemCategory}
                                </div>
                            ` : ''}
                            ${submission.attemptNumber ? `
                                <div>
                                    <strong>Attempt:</strong> #${submission.attemptNumber}
                                </div>
                            ` : ''}
                        </div>
                        ${submission.problemDescription ? `
                            <div style="margin-top: 1rem;">
                                <strong>Description:</strong>
                                <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                                    ${submission.problemDescription}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Submission Results -->
                    <div style="background: ${submission.status === 'Accepted' ? '#d4edda' : '#f8d7da'}; 
                               padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <h4 style="margin: 0 0 1rem 0; color: #333;">📊 Results</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                            <div>
                                <strong>Status:</strong> 
                                <span class="status-badge ${this.getStatusClass(submission.status)}">${submission.status}</span>
                            </div>
                            <div>
                                <strong>Runtime:</strong> ${submission.runtime || 'N/A'}
                            </div>
                            <div>
                                <strong>Memory:</strong> ${submission.memory || 'N/A'}
                            </div>
                            <div>
                                <strong>Language:</strong> 
                                <span class="language-badge">${submission.language}</span>
                            </div>
                        </div>
                        
                        ${submission.testResults ? `
                            <div style="margin-top: 1rem;">
                                <strong>Test Results:</strong>
                                <div style="margin-top: 0.5rem;">
                                    <div style="background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 6px;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <span>Tests Passed: <strong>${submission.testResults.passed}/${submission.testResults.total}</strong></span>
                                            <span>Pass Rate: <strong>${submission.testResults.passRate}</strong></span>
                                        </div>
                                        ${submission.testResults.feedback ? `
                                            <div style="font-style: italic; color: #666;">
                                                "${submission.testResults.feedback}"
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Submission Details -->
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <h4 style="margin: 0 0 1rem 0; color: #333;">📅 Submission Details</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                            <div>
                                <strong>Submitted:</strong> ${isValidDate ? submittedDate.toLocaleString() : 'Invalid Date'}
                            </div>
                            ${submission.userFullName ? `
                                <div>
                                    <strong>User:</strong> ${submission.userFullName}
                                </div>
                            ` : ''}
                            ${submission.codeLength ? `
                                <div>
                                    <strong>Code Length:</strong> ${submission.codeLength} characters
                                </div>
                            ` : ''}
                            <div>
                                <strong>ID:</strong> <code style="font-size: 0.8rem;">${submission.id}</code>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Code Section -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong>💻 Submitted Code:</strong>
                            <button onclick="Submissions.copyCode('${submission.id}')" 
                                    style="background: #667eea; color: white; border: none; padding: 0.25rem 0.75rem; 
                                           border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                                📋 Copy Code
                            </button>
                        </div>
                        <pre id="code-${submission.id}" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; 
                             overflow-x: auto; margin: 0; border: 1px solid #dee2e6; font-size: 0.9rem; line-height: 1.4;"><code>${this.escapeHtml(submission.code)}</code></pre>
                    </div>
                </div>
            `;
        }

        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Helper method to copy code to clipboard
    static copyCode(submissionId) {
        const submission = this.allSubmissions.find(s => s.id === submissionId);
        if (submission) {
            navigator.clipboard.writeText(submission.code).then(() => {
                this.showToast('Code copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback for older browsers
                const codeElement = document.getElementById(`code-${submissionId}`);
                if (codeElement) {
                    const range = document.createRange();
                    range.selectNode(codeElement);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    try {
                        document.execCommand('copy');
                        this.showToast('Code copied to clipboard!', 'success');
                    } catch (e) {
                        this.showToast('Failed to copy code', 'error');
                    }
                    window.getSelection().removeAllRanges();
                }
            });
        }
    }

    // Helper method to escape HTML
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Helper method to show toast notifications
    static showToast(message, type = 'info') {
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
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    static closeModal() {
        const modal = document.getElementById('submissionModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Submissions page loaded');
    Submissions.init();
});

// Make globally available
window.Submissions = Submissions;

console.log('✅ Enhanced Submissions class loaded successfully');
