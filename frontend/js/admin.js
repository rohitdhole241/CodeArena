// Admin panel functionality
class Admin {
    static init() {
        this.currentTab = 'problems';
        this.problems = [];
        this.users = [];
        
        this.bindEventListeners();
        this.loadProblems();
        this.loadUsers();
        this.loadStatistics();
    }

    static bindEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add problem button
        document.getElementById('addProblemBtn').addEventListener('click', this.showAddProblemModal.bind(this));

        // Problem form
        document.getElementById('problemForm').addEventListener('submit', this.saveProblem.bind(this));
        document.getElementById('cancelProblem').addEventListener('click', this.closeProblemModal.bind(this));
        document.getElementById('closeProblemModal').addEventListener('click', this.closeProblemModal.bind(this));

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeProblemModal();
            }
        });
    }

    static switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Load data for the active tab
        if (tabName === 'problems') {
            this.loadProblems();
        } else if (tabName === 'users') {
            this.loadUsers();
        } else if (tabName === 'statistics') {
            this.loadStatistics();
        }
    }

    static async loadProblems() {
        try {
            // Simulate API call
            this.problems = await this.simulateProblemsAPI();
            this.renderProblems();
        } catch (error) {
            console.error('Error loading problems:', error);
        }
    }

    static renderProblems() {
        const tableBody = document.getElementById('problemsTableBody');
        
        tableBody.innerHTML = this.problems.map(problem => `
            <tr>
                <td style="padding: 1rem;">
                    <div style="font-weight: 600;">${problem.title}</div>
                    <div style="font-size: 0.8rem; color: #666;">#${problem.id}</div>
                </td>
                <td style="padding: 1rem;">
                    <span class="difficulty-badge difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                </td>
                <td style="padding: 1rem;">${problem.category}</td>
                <td style="padding: 1rem;">${problem.solvedCount}</td>
                <td style="padding: 1rem;">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="Admin.editProblem(${problem.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="Admin.deleteProblem(${problem.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    static async loadUsers() {
        try {
            // Simulate API call
            this.users = await this.simulateUsersAPI();
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    static renderUsers() {
        const tableBody = document.getElementById('usersTableBody');
        
        tableBody.innerHTML = this.users.map(user => `
            <tr>
                <td style="padding: 1rem;">
                    <div style="font-weight: 600;">${user.username}</div>
                    <div style="font-size: 0.8rem; color: #666;">${user.fullName}</div>
                </td>
                <td style="padding: 1rem;">${user.email}</td>
                <td style="padding: 1rem;">
                    <span class="status-badge ${user.role === 'admin' ? 'status-active' : 'status-inactive'}">
                        ${user.role}
                    </span>
                </td>
                <td style="padding: 1rem;">${user.problemsSolved}</td>
                <td style="padding: 1rem;">${this.formatDate(user.joinedAt)}</td>
                <td style="padding: 1rem;">
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="Admin.viewUser(${user.id})">View</button>
                        <button class="action-btn edit-btn" onclick="Admin.editUser(${user.id})">Edit</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    static async loadStatistics() {
        try {
            // Simulate API call
            const stats = await this.simulateStatisticsAPI();
            
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            document.getElementById('totalProblems').textContent = stats.totalProblems;
            document.getElementById('totalSubmissions').textContent = stats.totalSubmissions;
            document.getElementById('successRate').textContent = stats.successRate + '%';
            
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    static showAddProblemModal() {
        document.getElementById('problemModalTitle').textContent = 'Add New Problem';
        document.getElementById('problemForm').reset();
        document.getElementById('problemModal').classList.remove('hidden');
    }

    static editProblem(problemId) {
        const problem = this.problems.find(p => p.id === problemId);
        if (!problem) return;

        document.getElementById('problemModalTitle').textContent = 'Edit Problem';
        document.getElementById('problemTitle').value = problem.title;
        document.getElementById('problemDifficulty').value = problem.difficulty;
        document.getElementById('problemCategory').value = problem.category;
        document.getElementById('problemDescription').value = problem.description;
        document.getElementById('problemExamples').value = JSON.stringify(problem.examples, null, 2);
        document.getElementById('problemConstraints').value = problem.constraints.join('\n');
        
        // Store the problem ID for updating
        document.getElementById('problemForm').dataset.problemId = problemId;
        
        document.getElementById('problemModal').classList.remove('hidden');
    }

    static async saveProblem(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const problemData = {
            title: formData.get('title'),
            difficulty: formData.get('difficulty'),
            category: formData.get('category'),
            description: formData.get('description'),
            examples: formData.get('examples'),
            constraints: formData.get('constraints')
        };

        try {
            // Validate examples JSON
            if (problemData.examples) {
                JSON.parse(problemData.examples);
            }

            // Simulate API call
            const isEdit = e.target.dataset.problemId;
            if (isEdit) {
                await this.simulateUpdateProblem(isEdit, problemData);
                alert('Problem updated successfully!');
            } else {
                await this.simulateCreateProblem(problemData);
                alert('Problem created successfully!');
            }

            this.closeProblemModal();
            this.loadProblems(); // Refresh the list

        } catch (error) {
            console.error('Error saving problem:', error);
            alert('Error saving problem: ' + error.message);
        }
    }

    static async deleteProblem(problemId) {
        if (!confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
            return;
        }

        try {
            // Simulate API call
            await this.simulateDeleteProblem(problemId);
            alert('Problem deleted successfully!');
            this.loadProblems(); // Refresh the list
        } catch (error) {
            console.error('Error deleting problem:', error);
            alert('Error deleting problem. Please try again.');
        }
    }

    static closeProblemModal() {
        document.getElementById('problemModal').classList.add('hidden');
        document.getElementById('problemForm').reset();
        delete document.getElementById('problemForm').dataset.problemId;
    }

    static viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        alert(`User Details:\n\nName: ${user.fullName}\nUsername: ${user.username}\nEmail: ${user.email}\nRole: ${user.role}\nProblems Solved: ${user.problemsSolved}\nJoined: ${this.formatDate(user.joinedAt)}`);
    }

    static editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const newRole = prompt('Enter new role (user/admin):', user.role);
        if (newRole && ['user', 'admin'].includes(newRole.toLowerCase())) {
            // Simulate API call
            alert(`User role updated to: ${newRole}`);
            this.loadUsers(); // Refresh the list
        }
    }

    static formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    // Simulation functions (replace with actual API calls)
    static async simulateProblemsAPI() {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            {
                id: 1,
                title: 'Two Sum',
                difficulty: 'Easy',
                category: 'Array',
                description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                examples: [
                    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }
                ],
                constraints: ['2 ≤ nums.length ≤ 10⁴'],
                solvedCount: 1234
            },
            {
                id: 2,
                title: 'Add Two Numbers',
                difficulty: 'Medium',
                category: 'Linked List',
                description: 'You are given two non-empty linked lists representing two non-negative integers.',
                examples: [
                    { input: 'l1 = [2,4,3], l2 = [5,6,4]', output: '[7,0,8]' }
                ],
                constraints: ['The number of nodes in each linked list is in the range [1, 100].'],
                solvedCount: 892
            },
            {
                id: 3,
                title: 'Longest Substring Without Repeating Characters',
                difficulty: 'Medium',
                category: 'String',
                description: 'Given a string s, find the length of the longest substring without repeating characters.',
                examples: [
                    { input: 's = "abcabcbb"', output: '3' }
                ],
                constraints: ['0 ≤ s.length ≤ 5 * 10⁴'],
                solvedCount: 756
            }
        ];
    }

    static async simulateUsersAPI() {
        await new Promise(resolve => setTimeout(resolve, 600));
        return [
            {
                id: 1,
                username: 'john_doe',
                fullName: 'John Doe',
                email: 'john@example.com',
                role: 'user',
                problemsSolved: 15,
                joinedAt: Date.now() - 2592000000 // 30 days ago
            },
            {
                id: 2,
                username: 'admin',
                fullName: 'Admin User',
                email: 'admin@codearena.com',
                role: 'admin',
                problemsSolved: 25,
                joinedAt: Date.now() - 7776000000 // 90 days ago
            },
            {
                id: 3,
                username: 'jane_smith',
                fullName: 'Jane Smith',
                email: 'jane@example.com',
                role: 'user',
                problemsSolved: 8,
                joinedAt: Date.now() - 1296000000 // 15 days ago
            }
        ];
    }

    static async simulateStatisticsAPI() {
        await new Promise(resolve => setTimeout(resolve, 400));
        return {
            totalUsers: 156,
            totalProblems: 48,
            totalSubmissions: 2341,
            successRate: 73
        };
    }

    static async simulateCreateProblem(problemData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Creating problem:', problemData);
        return { success: true };
    }

    static async simulateUpdateProblem(problemId, problemData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Updating problem:', problemId, problemData);
        return { success: true };
    }

    static async simulateDeleteProblem(problemId) {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('Deleting problem:', problemId);
        return { success: true };
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.admin-tabs')) {
        Admin.init();
    }
});
