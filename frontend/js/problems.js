// Problems page functionality - Enhanced Version
class Problems {
    static init() {
        console.log('📝 Problems page initializing...');
        
        this.problems = [];
        this.filteredProblems = [];
        this.isLoading = false;
        
        this.showLoadingState();
        this.bindEventListeners();
        this.loadProblems();
        this.checkAuthStatus();
    }

    static checkAuthStatus() {
        // Check if user is authenticated
        if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
            console.log('⚠️ User not authenticated, redirecting to login...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
    }

    static showLoadingState() {
        const container = document.getElementById('problemsContainer');
        if (!container) return;

        // Show loading skeletons
        container.innerHTML = `
            <div class="problem-item loading-skeleton" style="height: 140px; animation: pulse 1.5s ease-in-out infinite;"></div>
            <div class="problem-item loading-skeleton" style="height: 140px; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
            <div class="problem-item loading-skeleton" style="height: 140px; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.4s;"></div>
            <div class="problem-item loading-skeleton" style="height: 140px; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.6s;"></div>
            <div class="problem-item loading-skeleton" style="height: 140px; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.8s;"></div>
        `;

        // Add pulse animation CSS if not already present
        if (!document.getElementById('pulseAnimation')) {
            const style = document.createElement('style');
            style.id = 'pulseAnimation';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .loading-skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    static bindEventListeners() {
        console.log('📡 Binding event listeners...');

        // Search functionality with debounce
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            let searchTimeout;
            searchBox.addEventListener('input', (event) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(event);
                }, 300); // Debounce search by 300ms
            });
            console.log('✅ Search box event listener bound');
        }

        // Filter functionality
        const difficultyFilter = document.getElementById('difficultyFilter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', this.applyFilters.bind(this));
            console.log('✅ Difficulty filter event listener bound');
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', this.applyFilters.bind(this));
            console.log('✅ Category filter event listener bound');
        }

        // Clear filters
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', this.clearAllFilters.bind(this));
            console.log('✅ Clear filters event listener bound');
        }

        // Refresh button (if exists)
        const refreshBtn = document.getElementById('refreshProblems');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshProblems.bind(this));
            console.log('✅ Refresh button event listener bound');
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+F or Cmd+F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                if (searchBox) {
                    searchBox.focus();
                    searchBox.select();
                }
            }
            // Escape to clear search
            if (e.key === 'Escape' && searchBox === document.activeElement) {
                searchBox.value = '';
                this.applyFilters();
            }
        });

        console.log('📡 All event listeners bound successfully');
    }

    static async loadProblems() {
        try {
            this.isLoading = true;
            console.log('🔄 Loading problems from server...');
            
            // Add loading indicator
            this.updateLoadingStatus('Loading problems from server...');
            
            // Try to fetch from API first with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('/api/problems', {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && Array.isArray(result.data)) {
                    this.problems = result.data;
                    console.log(`✅ Loaded ${this.problems.length} problems from server`);
                    this.updateLoadingStatus(`Loaded ${this.problems.length} problems successfully!`);
                } else {
                    throw new Error('Invalid response format from server');
                }
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }

        } catch (error) {
            console.log('⚠️ Server fetch failed, using fallback data:', error.message);
            this.updateLoadingStatus('Server unavailable, loading cached problems...');
            
            // Fallback to hardcoded problems if server fails
            this.problems = this.getFallbackProblems();
            console.log(`📦 Using ${this.problems.length} fallback problems`);
        } finally {
            this.isLoading = false;
            
            // Always ensure we have some problems
            if (!this.problems || this.problems.length === 0) {
                console.log('⚠️ No problems available, creating default set...');
                this.problems = this.getFallbackProblems();
            }
            
            this.filteredProblems = [...this.problems];
            this.renderProblems();
            this.updateProblemStats();
        }
    }

    static updateLoadingStatus(message) {
        const container = document.getElementById('problemsContainer');
        if (!container) return;

        // Show loading message
        setTimeout(() => {
            if (this.isLoading) {
                const loadingElement = container.querySelector('.loading-skeleton');
                if (loadingElement) {
                    loadingElement.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #667eea; font-weight: 600;">
                            <div style="text-align: center;">
                                <div style="margin-bottom: 0.5rem;">🔄</div>
                                <div>${message}</div>
                            </div>
                        </div>
                    `;
                }
            }
        }, 500);
    }

    static getFallbackProblems() {
        return [
            {
                _id: '1',
                id: 1,
                title: 'Two Sum',
                difficulty: 'Easy',
                category: 'Array',
                description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                statistics: { solvedBy: 1234 },
                tags: ['hash-table', 'array'],
                companies: ['Amazon', 'Google', 'Microsoft']
            },
            {
                _id: '2',
                id: 2,
                title: 'Add Two Numbers',
                difficulty: 'Medium',
                category: 'Linked List',
                description: 'Add two numbers represented as linked lists.',
                statistics: { solvedBy: 892 },
                tags: ['linked-list', 'math'],
                companies: ['Amazon', 'Microsoft']
            },
            {
                _id: '3',
                id: 3,
                title: 'Longest Substring Without Repeating Characters',
                difficulty: 'Medium',
                category: 'String',
                description: 'Find the length of the longest substring without repeating characters.',
                statistics: { solvedBy: 756 },
                tags: ['string', 'sliding-window'],
                companies: ['Amazon', 'Google', 'Facebook']
            },
            {
                _id: '4',
                id: 4,
                title: 'Median of Two Sorted Arrays',
                difficulty: 'Hard',
                category: 'Array',
                description: 'Find the median of two sorted arrays.',
                statistics: { solvedBy: 234 },
                tags: ['array', 'binary-search', 'divide-and-conquer'],
                companies: ['Google', 'Amazon']
            },
            {
                _id: '5',
                id: 5,
                title: 'Valid Parentheses',
                difficulty: 'Easy',
                category: 'Stack',
                description: 'Determine if the input string has valid parentheses.',
                statistics: { solvedBy: 1567 },
                tags: ['stack', 'string'],
                companies: ['Amazon', 'Microsoft', 'Google']
            },
            {
                _id: '6',
                id: 6,
                title: 'Reverse Integer',
                difficulty: 'Easy',
                category: 'Math',
                description: 'Reverse digits of an integer.',
                statistics: { solvedBy: 987 },
                tags: ['math'],
                companies: ['Amazon', 'Apple']
            },
            {
                _id: '7',
                id: 7,
                title: 'Container With Most Water',
                difficulty: 'Medium',
                category: 'Array',
                description: 'Find two lines that together with x-axis forms a container that holds the most water.',
                statistics: { solvedBy: 543 },
                tags: ['array', 'two-pointers'],
                companies: ['Amazon', 'Google']
            },
            {
                _id: '8',
                id: 8,
                title: 'Merge Two Sorted Lists',
                difficulty: 'Easy',
                category: 'Linked List',
                description: 'Merge two sorted linked lists and return it as a sorted list.',
                statistics: { solvedBy: 1234 },
                tags: ['linked-list', 'recursion'],
                companies: ['Amazon', 'Microsoft', 'Apple']
            }
        ];
    }

    static renderProblems() {
        const container = document.getElementById('problemsContainer');
        const noResults = document.getElementById('noResults');
        
        if (!container) {
            console.error('❌ Problems container not found');
            return;
        }

        if (this.filteredProblems.length === 0) {
            container.innerHTML = '';
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: white;">
                        <h3 style="margin-bottom: 1rem;">🔍 No problems found</h3>
                        <p style="margin-bottom: 2rem;">Try adjusting your search criteria or filters</p>
                        <button onclick="Problems.clearAllFilters()" class="btn btn-primary">
                            Clear All Filters
                        </button>
                    </div>
                `;
            }
            return;
        }

        if (noResults) {
            noResults.style.display = 'none';
        }
        
        const problemsHtml = this.filteredProblems.map(problem => {
            const solvedStatus = this.isProblemSolved(problem._id || problem.id);
            const solvedClass = solvedStatus ? 'problem-solved' : '';
            const solvedIcon = solvedStatus ? '✅' : '';
            
            return `
                <div class="problem-item ${solvedClass}" onclick="Problems.openProblem('${problem._id || problem.id}')" title="Click to solve ${problem.title}">
                    <div class="problem-header">
                        <h3 class="problem-title">
                            ${solvedIcon} ${problem.title}
                            ${solvedStatus ? '<span style="color: #28a745; font-size: 0.8rem; margin-left: 0.5rem;">(Solved)</span>' : ''}
                        </h3>
                        <span class="difficulty-badge difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                    </div>
                    
                    <div class="problem-description" style="margin: 1rem 0; color: #666; font-size: 0.9rem; line-height: 1.4;">
                        ${problem.description.substring(0, 120)}${problem.description.length > 120 ? '...' : ''}
                    </div>
                    
                    <div class="problem-meta">
                        <span>📂 ${problem.category}</span>
                        <span>👥 ${problem.statistics?.solvedBy || 0} solved</span>
                        ${problem.companies ? `<span>🏢 ${problem.companies.slice(0, 2).join(', ')}</span>` : ''}
                    </div>
                    
                    ${problem.tags ? `
                        <div class="problem-tags" style="margin-top: 0.5rem;">
                            ${problem.tags.slice(0, 3).map(tag => `
                                <span style="background: #e9ecef; color: #495057; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.7rem; margin-right: 0.3rem;">
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="problem-stats" style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #667eea; font-weight: 600;">Click to solve →</span>
                        <span style="font-size: 0.8rem; color: #888;">#${problem.id}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = problemsHtml;
        console.log(`🎨 Rendered ${this.filteredProblems.length} problems`);
        
        // Add solved styling if not already present
        this.addSolvedStyling();
    }

    static addSolvedStyling() {
        if (!document.getElementById('solvedProblemStyles')) {
            const style = document.createElement('style');
            style.id = 'solvedProblemStyles';
            style.textContent = `
                .problem-solved {
                    border-left: 4px solid #28a745 !important;
                    background: linear-gradient(to right, #d4edda 0%, #ffffff 100%) !important;
                }
                .problem-solved:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(40, 167, 69, 0.2) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    static isProblemSolved(problemId) {
        // Check if user has solved this problem
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        return submissions.some(submission => 
            submission.problemId === problemId && submission.status === 'Accepted'
        );
    }

    static updateProblemStats() {
        // Update page statistics
        const totalProblems = this.problems.length;
        const easyProblems = this.problems.filter(p => p.difficulty === 'Easy').length;
        const mediumProblems = this.problems.filter(p => p.difficulty === 'Medium').length;
        const hardProblems = this.problems.filter(p => p.difficulty === 'Hard').length;
        
        console.log('📊 Problem Statistics:', {
            total: totalProblems,
            easy: easyProblems,
            medium: mediumProblems,
            hard: hardProblems
        });

        // Update UI if stats elements exist
        const statsElement = document.getElementById('problemStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1rem 0;">
                    <span style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; color: white;">
                        📊 Total: ${totalProblems}
                    </span>
                    <span style="background: rgba(40,167,69,0.2); padding: 0.5rem 1rem; border-radius: 20px; color: white;">
                        🟢 Easy: ${easyProblems}
                    </span>
                    <span style="background: rgba(255,193,7,0.2); padding: 0.5rem 1rem; border-radius: 20px; color: white;">
                        🟡 Medium: ${mediumProblems}
                    </span>
                    <span style="background: rgba(220,53,69,0.2); padding: 0.5rem 1rem; border-radius: 20px; color: white;">
                        🔴 Hard: ${hardProblems}
                    </span>
                </div>
            `;
        }
    }

    static openProblem(problemId) {
        console.log(`🔗 Opening problem with ID: ${problemId}`);
        
        // Add loading feedback
        const problemElement = event?.target?.closest('.problem-item');
        if (problemElement) {
            problemElement.style.opacity = '0.7';
            problemElement.style.transform = 'scale(0.98)';
        }
        
        // Navigate to problem detail page with the specific ID
        const url = `/problem-detail.html?id=${problemId}`;
        
        // Track problem view
        this.trackProblemView(problemId);
        
        // Add slight delay for visual feedback
        setTimeout(() => {
            window.location.href = url;
        }, 150);
    }

    static trackProblemView(problemId) {
        // Track which problems user has viewed
        const viewedProblems = JSON.parse(localStorage.getItem('viewedProblems') || '[]');
        if (!viewedProblems.includes(problemId)) {
            viewedProblems.push(problemId);
            localStorage.setItem('viewedProblems', JSON.stringify(viewedProblems));
        }
    }

    static handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        console.log('🔍 Search term:', searchTerm);
        
        // Show search feedback
        if (searchTerm.length > 0) {
            event.target.style.borderColor = '#667eea';
        } else {
            event.target.style.borderColor = '#ddd';
        }
        
        this.applyFilters();
    }

    static applyFilters() {
        const searchTerm = document.getElementById('searchBox')?.value.toLowerCase().trim() || '';
        const selectedDifficulty = document.getElementById('difficultyFilter')?.value || '';
        const selectedCategory = document.getElementById('categoryFilter')?.value || '';

        this.filteredProblems = this.problems.filter(problem => {
            const matchesSearch = !searchTerm || 
                problem.title.toLowerCase().includes(searchTerm) ||
                problem.description.toLowerCase().includes(searchTerm) ||
                problem.category.toLowerCase().includes(searchTerm) ||
                (problem.tags && problem.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
                
            const matchesDifficulty = !selectedDifficulty || 
                problem.difficulty === selectedDifficulty;
                
            const matchesCategory = !selectedCategory || 
                problem.category === selectedCategory;

            return matchesSearch && matchesDifficulty && matchesCategory;
        });

        console.log(`🔍 Filtered to ${this.filteredProblems.length} problems (from ${this.problems.length} total)`);
        this.renderProblems();
        
        // Update filter feedback
        this.updateFilterFeedback(searchTerm, selectedDifficulty, selectedCategory);
    }

    static updateFilterFeedback(searchTerm, difficulty, category) {
        const activeFilters = [];
        if (searchTerm) activeFilters.push(`Search: "${searchTerm}"`);
        if (difficulty) activeFilters.push(`Difficulty: ${difficulty}`);
        if (category) activeFilters.push(`Category: ${category}`);
        
        const feedbackElement = document.getElementById('filterFeedback');
        if (feedbackElement) {
            if (activeFilters.length > 0) {
                feedbackElement.innerHTML = `
                    <div style="background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 8px; margin: 1rem 0; color: white;">
                        🔍 Active filters: ${activeFilters.join(', ')}
                        <button onclick="Problems.clearAllFilters()" style="background: none; border: none; color: white; margin-left: 1rem; cursor: pointer; text-decoration: underline;">
                            Clear all
                        </button>
                    </div>
                `;
                feedbackElement.style.display = 'block';
            } else {
                feedbackElement.style.display = 'none';
            }
        }
    }

    static clearAllFilters() {
        console.log('🧹 Clearing all filters...');
        
        // Clear form inputs
        const searchBox = document.getElementById('searchBox');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (searchBox) {
            searchBox.value = '';
            searchBox.style.borderColor = '#ddd';
        }
        if (difficultyFilter) difficultyFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        
        // Reset filtered problems
        this.filteredProblems = [...this.problems];
        this.renderProblems();
        
        // Update filter feedback
        this.updateFilterFeedback('', '', '');
        
        // Focus search box
        if (searchBox) {
            searchBox.focus();
        }
        
        console.log('🧹 All filters cleared');
        
        // Show success feedback
        this.showToast('All filters cleared!', 'success');
    }

    static refreshProblems() {
        console.log('🔄 Refreshing problems...');
        this.showLoadingState();
        this.loadProblems();
        this.showToast('Problems refreshed!', 'success');
    }

    static showToast(message, type = 'info') {
        // Create and show toast notification
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
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Utility method to sort problems
    static sortProblems(sortBy = 'default') {
        switch (sortBy) {
            case 'title':
                this.problems.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'difficulty':
                const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                this.problems.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
                break;
            case 'solved':
                this.problems.sort((a, b) => (b.statistics?.solvedBy || 0) - (a.statistics?.solvedBy || 0));
                break;
            default:
                this.problems.sort((a, b) => (a.id || a._id) - (b.id || b._id));
        }
        
        this.applyFilters(); // Re-apply filters after sorting
        console.log(`📊 Problems sorted by: ${sortBy}`);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Problems page loaded');
    Problems.init();
});

// Global method for external access
window.Problems = Problems;

console.log('✅ Enhanced Problems class loaded successfully');
