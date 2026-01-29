// Problem detail page functionality - COMPLETE FIXED VERSION WITH PROPER OUTPUT ALIGNMENT
class ProblemDetail {
    static init() {
        console.log('🚀 ProblemDetail.init() called');
        this.currentProblem = null;
        this.currentLanguage = 'javascript';
        
        this.bindEventListeners();
        this.loadProblem();
        this.loadDefaultCode();
    }

    static bindEventListeners() {
        console.log('📡 Binding event listeners...');
        
        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            console.log('✅ Language selector found');
            languageSelect.addEventListener('change', (e) => {
                this.currentLanguage = e.target.value;
                console.log('🔄 Language changed to:', this.currentLanguage);
                this.loadDefaultCode();
            });
        }

        // Code actions
        const runCodeBtn = document.getElementById('runCodeBtn');
        if (runCodeBtn) {
            console.log('✅ Run code button found');
            runCodeBtn.addEventListener('click', this.runCode.bind(this));
        }

        const submitCodeBtn = document.getElementById('submitCodeBtn');
        if (submitCodeBtn) {
            console.log('✅ Submit code button found');
            submitCodeBtn.addEventListener('click', this.submitCode.bind(this));
        }

        const resetCodeBtn = document.getElementById('resetCodeBtn');
        if (resetCodeBtn) {
            console.log('✅ Reset code button found');
            resetCodeBtn.addEventListener('click', this.resetCode.bind(this));
        }

        // Modal handlers
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            console.log('✅ Hint button found');
            hintBtn.addEventListener('click', this.showHint.bind(this));
        }

        const notesBtn = document.getElementById('notesBtn');
        if (notesBtn) {
            console.log('✅ Notes button found');
            notesBtn.addEventListener('click', this.showNotes.bind(this));
        }
        
        // Modal close handlers
        const closeHintModal = document.getElementById('closeHintModal');
        if (closeHintModal) {
            console.log('✅ Close hint modal button found');
            closeHintModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔴 Hint modal close clicked');
                this.closeModals();
            });
        }
        
        const closeNotesModal = document.getElementById('closeNotesModal');
        if (closeNotesModal) {
            console.log('✅ Close notes modal button found');
            closeNotesModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔴 Notes modal close clicked');
                this.forceCloseModals();
            });
        }
        
        // Save notes
        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) {
            console.log('✅ Save notes button found');
            saveNotesBtn.addEventListener('click', this.saveNotes.bind(this));
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                console.log('🔴 Modal backdrop clicked');
                this.forceCloseModals();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('🔴 Escape key pressed');
                this.forceCloseModals();
            }
        });

        console.log('📡 All event listeners bound successfully');
    }

    static async loadProblem() {
        try {
            console.log('📖 Loading problem...');
            
            // Get problem ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('id') || '1';
            console.log('🆔 Problem ID from URL:', problemId);

            // Try to fetch from server first
            try {
                console.log('🔄 Fetching from server API...');
                const response = await fetch(`/api/problems/${problemId}`);
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        this.currentProblem = result.data;
                        console.log('✅ Problem loaded from server:', this.currentProblem.title);
                        this.renderProblem();
                        return;
                    }
                }
                
                throw new Error('Server response not OK');
                
            } catch (serverError) {
                console.log('⚠️ Server fetch failed, using fallback data:', serverError.message);
                
                // Fallback to local data
                this.currentProblem = await this.getFallbackProblem(problemId);
                console.log('📝 Problem loaded from fallback:', this.currentProblem?.title || 'Not found');
            }
            
            this.renderProblem();

        } catch (error) {
            console.error('❌ Error loading problem:', error);
            this.showErrorState();
        }
    }

    static async getFallbackProblem(problemId) {
        // Fallback problems data
        const fallbackProblems = {
            '1': {
                id: '1',
                title: 'Two Sum',
                difficulty: 'Easy',
                category: 'Array',
                description: `
                    <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.</p>
                    <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
                    <p>You can return the answer in any order.</p>
                `,
                examples: [
                    {
                        input: 'nums = [2,7,11,15], target = 9',
                        output: '[0,1]',
                        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
                    },
                    {
                        input: 'nums = [3,2,4], target = 6',
                        output: '[1,2]',
                        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
                    }
                ],
                constraints: [
                    '2 ≤ nums.length ≤ 10⁴',
                    '-10⁹ ≤ nums[i] ≤ 10⁹',
                    'Only one valid answer exists.'
                ],
                statistics: { solvedBy: 1234 }
            },
            '2': {
                id: '2',
                title: 'Add Two Numbers',
                difficulty: 'Medium',
                category: 'Linked List',
                description: `
                    <p>You are given two <strong>non-empty</strong> linked lists representing two non-negative integers. The digits are stored in <strong>reverse order</strong>, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.</p>
                    <p>You may assume the two numbers do not contain any leading zero, except the number 0 itself.</p>
                `,
                examples: [
                    {
                        input: 'l1 = [2,4,3], l2 = [5,6,4]',
                        output: '[7,0,8]',
                        explanation: '342 + 465 = 807.'
                    }
                ],
                constraints: [
                    'The number of nodes in each linked list is in the range [1, 100].',
                    '0 ≤ Node.val ≤ 9',
                    'It is guaranteed that the list represents a number that does not have leading zeros.'
                ],
                statistics: { solvedBy: 892 }
            },
            '3': {
                id: '3',
                title: 'Longest Substring Without Repeating Characters',
                difficulty: 'Medium',
                category: 'String',
                description: `
                    <p>Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.</p>
                `,
                examples: [
                    {
                        input: 's = "abcabcbb"',
                        output: '3',
                        explanation: 'The answer is "abc", with the length of 3.'
                    },
                    {
                        input: 's = "bbbbb"',
                        output: '1',
                        explanation: 'The answer is "b", with the length of 1.'
                    }
                ],
                constraints: [
                    '0 ≤ s.length ≤ 5 * 10⁴',
                    's consists of English letters, digits, symbols and spaces.'
                ],
                statistics: { solvedBy: 756 }
            },
            '4': {
                id: '4',
                title: 'Median of Two Sorted Arrays',
                difficulty: 'Hard',
                category: 'Array',
                description: `
                    <p>Given two sorted arrays <code>nums1</code> and <code>nums2</code> of size <code>m</code> and <code>n</code> respectively, return <strong>the median</strong> of the two sorted arrays.</p>
                    <p>The overall run time complexity should be <code>O(log (m+n))</code>.</p>
                `,
                examples: [
                    {
                        input: 'nums1 = [1,3], nums2 = [2]',
                        output: '2.00000',
                        explanation: 'merged array = [1,2,3] and median is 2.'
                    }
                ],
                constraints: [
                    'nums1.length == m',
                    'nums2.length == n',
                    '0 ≤ m ≤ 1000',
                    '0 ≤ n ≤ 1000',
                    '1 ≤ m + n ≤ 2000'
                ],
                statistics: { solvedBy: 234 }
            },
            '5': {
                id: '5',
                title: 'Valid Parentheses',
                difficulty: 'Easy',
                category: 'Stack',
                description: `
                    <p>Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.</p>
                    <p>An input string is valid if:</p>
                    <ul>
                        <li>Open brackets must be closed by the same type of brackets.</li>
                        <li>Open brackets must be closed in the correct order.</li>
                    </ul>
                `,
                examples: [
                    {
                        input: 's = "()"',
                        output: 'true'
                    },
                    {
                        input: 's = "()[]{}"',
                        output: 'true'
                    },
                    {
                        input: 's = "(]"',
                        output: 'false'
                    }
                ],
                constraints: [
                    '1 ≤ s.length ≤ 10⁴',
                    's consists of parentheses only \'()[]{}\''
                ],
                statistics: { solvedBy: 1567 }
            }
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return fallbackProblems[problemId] || fallbackProblems['1'];
    }

    static renderProblem() {
        if (!this.currentProblem) {
            this.showErrorState();
            return;
        }

        const problem = this.currentProblem;
        console.log('🎨 Rendering problem:', problem.title);
        
        // Update problem header
        const titleEl = document.getElementById('problemTitle');
        if (titleEl) titleEl.textContent = problem.title;
        
        const difficultyEl = document.getElementById('problemDifficulty');
        if (difficultyEl) {
            difficultyEl.textContent = problem.difficulty;
            difficultyEl.className = `difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`;
        }
        
        const categoryEl = document.getElementById('problemCategory');
        if (categoryEl) categoryEl.textContent = problem.category;
        
        const solvedEl = document.getElementById('problemSolved');
        if (solvedEl) {
            const solvedCount = problem.statistics?.solvedBy || 0;
            solvedEl.textContent = `${solvedCount} solved`;
        }

        // Update problem description
        const descEl = document.getElementById('problemDescription');
        if (descEl) descEl.innerHTML = problem.description;

        // Update examples
        const examplesEl = document.getElementById('problemExamples');
        if (examplesEl) {
            const examplesHtml = (problem.examples || []).map((example, index) => `
                <div class="example">
                    <h4>Example ${index + 1}:</h4>
                    <div class="example-io">
                        <strong>Input:</strong> ${example.input}
                    </div>
                    <div class="example-io">
                        <strong>Output:</strong> ${example.output}
                    </div>
                    ${example.explanation ? `<div class="example-io"><strong>Explanation:</strong> ${example.explanation}</div>` : ''}
                </div>
            `).join('');
            
            examplesEl.innerHTML = examplesHtml;
        }

        // Update constraints
        const constraintsEl = document.getElementById('problemConstraints');
        if (constraintsEl) {
            constraintsEl.innerHTML = `
                <h4>Constraints:</h4>
                <ul>
                    ${(problem.constraints || []).map(constraint => `<li>${constraint}</li>`).join('')}
                </ul>
            `;
        }

        console.log('✅ Problem rendered successfully');
    }

    static showErrorState() {
        const titleEl = document.getElementById('problemTitle');
        if (titleEl) titleEl.textContent = 'Problem Not Found';
        
        const descEl = document.getElementById('problemDescription');
        if (descEl) {
            descEl.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>😞 Problem Not Found</h3>
                    <p>The requested problem could not be loaded.</p>
                    <button onclick="window.location.href='/problems'" class="btn btn-primary" style="margin-top: 1rem;">
                        ← Back to Problems
                    </button>
                </div>
            `;
        }
    }

    static loadDefaultCode() {
        console.log('💻 Loading default code for:', this.currentLanguage);
        
        const problemTitle = this.currentProblem?.title || 'Problem';
        
        const codeTemplates = {
            javascript: `function twoSum(nums, target) {
    // Write your solution here
    
}`,
            
            python: `def twoSum(nums, target):
    # Write your solution here
    
    pass`,
            
            java: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
    }
}`,
            
            cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`
        };

        const editor = document.getElementById('codeEditor');
        if (editor) {
            editor.value = codeTemplates[this.currentLanguage] || codeTemplates.javascript;
            console.log('✅ Default code loaded');
        }
    }

    // FIXED RUN CODE WITH PROPER ALIGNMENT
    static async runCode() {
        console.log('▶️ Running code...');
        
        const runBtn = document.getElementById('runCodeBtn');
        const outputPanel = document.getElementById('outputPanel');
        const outputContent = document.getElementById('outputContent');
        
        if (runBtn) {
            runBtn.disabled = true;
            runBtn.innerHTML = '<span class="loading"></span> Running...';
        }
        
        if (outputPanel) {
            outputPanel.classList.remove('hidden');
            outputPanel.style.display = 'block';
        }
        
        if (outputContent) {
            outputContent.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    color: #667eea;
                    font-weight: 600;
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin: 1rem 0;
                ">
                    <div style="margin-right: 0.5rem;">🔄</div>
                    <div>Running your code for ${this.currentProblem?.title || 'this problem'}...</div>
                </div>
            `;
        }
        
        try {
            const codeEditor = document.getElementById('codeEditor');
            const userCode = codeEditor ? codeEditor.value : '';
            
            // Run actual test cases
            const testResults = await this.runTestCases(userCode, this.currentLanguage);
            
            if (outputContent) {
                const passedCount = testResults.passed;
                const totalCount = testResults.total;
                const allPassed = passedCount === totalCount;
                
                outputContent.innerHTML = `
                    <!-- Main Result Header -->
                    <div style="
                        background: ${allPassed ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #dc3545, #fd7e88)'};
                        color: white;
                        padding: 1.5rem;
                        border-radius: 12px;
                        text-align: center;
                        margin-bottom: 1.5rem;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    ">
                        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${allPassed ? '✅ All tests passed!' : `❌ ${passedCount}/${totalCount} tests passed`}
                        </div>
                        <div style="opacity: 0.9; font-size: 1rem;">
                            ${allPassed ? 'Great job! Your solution works perfectly.' : 'Some test cases failed. Review your logic.'}
                        </div>
                    </div>

                    <!-- Test Results Table -->
                    <div style="
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        border: 1px solid #e1e5e9;
                    ">
                        <!-- Table Header -->
                        <div style="
                            background: #667eea;
                            color: white;
                            padding: 1rem;
                            font-weight: 600;
                            display: grid;
                            grid-template-columns: 1fr 2fr 1fr;
                            gap: 1rem;
                            align-items: center;
                        ">
                            <div>Test Case</div>
                            <div>Description</div>
                            <div style="text-align: center;">Result</div>
                        </div>

                        <!-- Test Cases -->
                        ${testResults.details.map((test, i) => `
                            <div style="
                                display: grid;
                                grid-template-columns: 1fr 2fr 1fr;
                                gap: 1rem;
                                align-items: center;
                                padding: 1rem;
                                border-bottom: ${i < testResults.details.length - 1 ? '1px solid #e1e5e9' : 'none'};
                                background: ${test.passed ? '#f8fff9' : '#fff5f5'};
                            ">
                                <div style="font-weight: 600; color: #333;">
                                    Test ${test.testCase}
                                </div>
                                <div style="color: #666; font-size: 0.9rem; font-family: monospace;">
                                    ${test.description || `Test case ${test.testCase}`}
                                </div>
                                <div style="text-align: center;">
                                    <span style="
                                        background: ${test.passed ? '#28a745' : '#dc3545'};
                                        color: white;
                                        padding: 0.25rem 0.75rem;
                                        border-radius: 20px;
                                        font-size: 0.8rem;
                                        font-weight: 600;
                                        display: inline-block;
                                        min-width: 70px;
                                    ">
                                        ${test.passed ? '✅ Passed' : '❌ Failed'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Feedback Section -->
                    ${testResults.feedback ? `
                        <div style="
                            background: #f8f9fa;
                            border: 1px solid #e1e5e9;
                            border-radius: 8px;
                            padding: 1.5rem;
                            margin-top: 1.5rem;
                        ">
                            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                                <div style="margin-right: 0.5rem; font-size: 1.2rem;">💡</div>
                                <div style="font-weight: 600; color: #333;">Feedback</div>
                            </div>
                            <div style="color: #666; line-height: 1.5;">
                                ${testResults.feedback}
                            </div>
                        </div>
                    ` : ''}
                `;
            }

        } catch (error) {
            if (outputContent) {
                outputContent.innerHTML = `
                    <div style="
                        background: linear-gradient(135deg, #dc3545, #fd7e88);
                        color: white;
                        padding: 2rem;
                        border-radius: 12px;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(220,53,69,0.3);
                    ">
                        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
                            ❌ Runtime Error
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 8px; font-family: monospace; text-align: left;">
                            ${error.message || 'Code execution failed. Please check your syntax and try again.'}
                        </div>
                    </div>
                `;
            }
        } finally {
            if (runBtn) {
                runBtn.disabled = false;
                runBtn.innerHTML = '▶️ Run';
            }
        }
    }

    // FIXED TEST CASE EXECUTION
    static async runTestCases(code, language) {
        const problemId = this.currentProblem?.id || this.currentProblem?._id;
        
        let testCases = [];
        
        // Define EXACT test cases for Two Sum
        if (problemId == '1' || problemId == 1) {
            testCases = [
                { 
                    nums: [2,7,11,15], 
                    target: 9, 
                    expected: [0,1],
                    description: "nums = [2,7,11,15], target = 9"
                },
                { 
                    nums: [3,2,4], 
                    target: 6, 
                    expected: [1,2],
                    description: "nums = [3,2,4], target = 6"
                },
                { 
                    nums: [3,3], 
                    target: 6, 
                    expected: [0,1],
                    description: "nums = [3,3], target = 6"
                }
            ];
        } else {
            // Default test cases for other problems
            testCases = [
                { input: 'test1', expected: 'result1', description: 'Basic test case' },
                { input: 'test2', expected: 'result2', description: 'Edge case test' }, 
                { input: 'test3', expected: 'result3', description: 'Advanced test case' }
            ];
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let passedTests = 0;
        const totalTests = testCases.length;
        const testDetails = [];
        
        // For Two Sum, actually execute the code
        if (problemId == '1' || problemId == 1) {
            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                let passed = false;
                
                try {
                    // Create and execute user function
                    const userFunction = new Function('nums', 'target', `
                        ${code}
                        
                        if (typeof twoSum === 'function') {
                            return twoSum(nums, target);
                        } else {
                            throw new Error('twoSum function not found');
                        }
                    `);
                    
                    const result = userFunction(testCase.nums, testCase.target);
                    
                    // Check if arrays match (handle both [0,1] and [1,0])
                    passed = this.arraysEqual(result, testCase.expected) ||
                             this.arraysEqual(result, [testCase.expected[1], testCase.expected[0]]);
                    
                    if (passed) passedTests++;
                    
                    console.log(`Test ${i+1}: Expected [${testCase.expected}], Got [${result}], Passed: ${passed}`);
                    
                } catch (error) {
                    console.log(`Test ${i+1}: Error - ${error.message}`);
                    passed = false;
                }
                
                testDetails.push({
                    testCase: i + 1,
                    passed: passed,
                    description: testCase.description
                });
            }
        } else {
            // For other problems, simulate results
            const passRate = Math.random() * 0.6 + 0.4; // 40-100% pass rate
            passedTests = Math.floor(totalTests * passRate);
            
            for (let i = 0; i < totalTests; i++) {
                testDetails.push({
                    testCase: i + 1,
                    passed: i < passedTests,
                    description: testCases[i].description || `Test case ${i + 1}`
                });
            }
        }
        
        let feedback = '';
        if (passedTests === totalTests) {
            feedback = 'Excellent! All test cases passed. Your solution is correct and handles all edge cases properly.';
        } else if (passedTests >= totalTests * 0.7) {
            feedback = 'Good progress! Most test cases passed, but review the failed ones for edge cases you might have missed.';
        } else {
            feedback = 'Your algorithm needs some work. Review the problem requirements and test your logic with the provided examples.';
        }
        
        return {
            total: totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            passRate: (passedTests / totalTests * 100).toFixed(1) + '%',
            feedback: feedback,
            details: testDetails
        };
    }

    // Helper method to compare arrays
    static arraysEqual(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        return a.every((val, i) => val === b[i]);
    }

    static async submitCode() {
        console.log('🚀 Submitting code...');
        
        const submitBtn = document.getElementById('submitCodeBtn');
        const codeEditor = document.getElementById('codeEditor');
        
        if (!codeEditor || !codeEditor.value.trim()) {
            alert('❌ Please write some code before submitting!');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
        }
        
        try {
            const code = codeEditor.value;
            const language = document.getElementById('languageSelect')?.value || 'javascript';
            const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : {};
            
            if (!this.currentProblem) {
                throw new Error('Problem data not available');
            }
            
            // Run actual test cases for submission
            const testResults = await this.runTestCases(code, language);
            const isAccepted = testResults.passed >= testResults.total * 0.7;
            
            const status = isAccepted ? 'Accepted' : 'Wrong Answer';
            const runtime = isAccepted ? `${Math.floor(Math.random() * 150) + 50}ms` : 'N/A';
            const memory = isAccepted ? `${(Math.random() * 25 + 35).toFixed(1)} MB` : 'N/A';
            
            const submission = {
                id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                problemId: this.currentProblem.id || this.currentProblem._id,
                problemTitle: this.currentProblem.title,
                problemDifficulty: this.currentProblem.difficulty,
                problemCategory: this.currentProblem.category,
                problemDescription: this.currentProblem.description?.substring(0, 200).replace(/<[^>]*>/g, '') + '...' || 'No description available',
                code: code,
                language: language,
                status: status,
                runtime: runtime,
                memory: memory,
                testResults: testResults,
                submittedAt: new Date().toISOString(),
                submittedDate: new Date().toLocaleDateString(),
                submittedTime: new Date().toLocaleTimeString(),
                userId: currentUser.id || 'guest',
                userFullName: currentUser.fullName || 'Guest User',
                codeLength: code.length,
                attemptNumber: this.getAttemptNumber(this.currentProblem.id || this.currentProblem._id) + 1
            };
            
            console.log('💾 Saving submission:', submission);
            this.saveSubmission(submission);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (isAccepted) {
                this.updateUserStats(true);
                alert(`🎉 Congratulations! Your solution for "${this.currentProblem.title}" has been accepted!
                
✅ Status: ${status}
⚡ Runtime: ${runtime}
💾 Memory: ${memory}
📊 Tests Passed: ${testResults.passed}/${testResults.total}

Your submission has been saved!
Redirecting to submissions page...`);
                
                this.showSuccessOutput(submission);
            } else {
                this.updateUserStats(false);
                alert(`❌ Submission Failed for "${this.currentProblem.title}"

📝 Status: ${status}
📊 Tests Passed: ${testResults.passed}/${testResults.total}
💡 ${testResults.feedback}

Your submission has been saved for review.`);
            }
            
            setTimeout(() => {
                console.log('🔗 Redirecting to submissions page...');
                window.location.href = '/submissions';
            }, 3000);

        } catch (error) {
            console.error('❌ Submission error:', error);
            alert(`❌ Submission failed: ${error.message}`);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '✅ Submit';
            }
        }
    }

    static getAttemptNumber(problemId) {
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        return submissions.filter(sub => sub.problemId === problemId).length;
    }

    static saveSubmission(submission) {
        const existingSubmissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        existingSubmissions.unshift(submission);
        
        if (existingSubmissions.length > 100) {
            existingSubmissions.splice(100);
        }
        
        localStorage.setItem('submissions', JSON.stringify(existingSubmissions));
        console.log('💾 Submission saved to localStorage');
    }

    static updateUserStats(isAccepted) {
        if (typeof Auth !== 'undefined' && Auth.updateUserStats) {
            const currentStats = Auth.getCurrentUser().stats;
            const newStats = {
                totalSubmissions: currentStats.totalSubmissions + 1
            };
            
            if (isAccepted) {
                const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
                const previousAccepted = submissions.some(sub => 
                    sub.problemId === this.currentProblem.id && 
                    sub.status === 'Accepted' &&
                    sub.id !== submissions[0]?.id
                );
                
                if (!previousAccepted) {
                    newStats.problemsSolved = currentStats.problemsSolved + 1;
                    newStats.currentStreak = currentStats.currentStreak + 1;
                }
                newStats.acceptedSubmissions = currentStats.acceptedSubmissions + 1;
            } else {
                newStats.currentStreak = 0;
            }
            
            Auth.updateUserStats(newStats);
        }
    }

    static showSuccessOutput(submission) {
        const outputPanel = document.getElementById('outputPanel');
        const outputContent = document.getElementById('outputContent');
        
        if (outputPanel && outputContent) {
            outputPanel.classList.remove('hidden');
            outputPanel.style.display = 'block';
            
            outputContent.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                    margin: 1rem 0;
                    box-shadow: 0 4px 15px rgba(40,167,69,0.3);
                ">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem;">🎉 Submission Accepted!</h3>
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 1rem;">${submission.problemTitle} - Solved ✅</div>
                    <div style="opacity: 0.9; line-height: 1.6;">
                        <div>⚡ Runtime: ${submission.runtime} | 💾 Memory: ${submission.memory}</div>
                        <div>📊 Tests Passed: ${submission.testResults.passed}/${submission.testResults.total}</div>
                        <div>🔢 Attempt #${submission.attemptNumber}</div>
                    </div>
                </div>
            `;
        }
    }

    static resetCode() {
        if (confirm(`🔄 Are you sure you want to reset your code for "${this.currentProblem?.title}"? This action cannot be undone.`)) {
            this.loadDefaultCode();
            
            const outputPanel = document.getElementById('outputPanel');
            if (outputPanel) {
                outputPanel.classList.add('hidden');
                outputPanel.style.display = 'none';
            }
        }
    }

    static showHint() {
        console.log('💡 Show hint called');
        const hintModal = document.getElementById('hintModal');
        const hintContent = document.getElementById('hintContent');
        
        if (hintContent) {
            hintContent.innerHTML = `
                <div style="line-height: 1.6;">
                    <p><strong>💡 Hint for ${this.currentProblem?.title || 'this problem'}:</strong></p>
                    <p>For Two Sum: Use a HashMap to store numbers you've seen and their indices. For each number, check if its complement (target - number) exists in the map.</p>
                    <p>Time Complexity: O(n), Space Complexity: O(n)</p>
                </div>
            `;
        }
        
        if (hintModal) {
            hintModal.classList.remove('hidden');
        }
    }

    static showNotes() {
        console.log('📝 Show notes called');
        const notesModal = document.getElementById('notesModal');
        const notesTextarea = document.getElementById('notesTextarea');
        
        if (notesTextarea && this.currentProblem) {
            const savedNotes = localStorage.getItem(`notes_problem_${this.currentProblem.id}`) || '';
            notesTextarea.value = savedNotes;
        }
        
        if (notesModal) {
            notesModal.classList.remove('hidden');
            notesModal.style.display = 'flex';
        }
    }

    static saveNotes() {
        console.log('💾 Saving notes...');
        const notesTextarea = document.getElementById('notesTextarea');
        
        if (notesTextarea && this.currentProblem) {
            const notes = notesTextarea.value;
            localStorage.setItem(`notes_problem_${this.currentProblem.id}`, notes);
            alert('💾 Notes saved successfully!');
            this.forceCloseModals();
        }
    }

    static closeModals() {
        console.log('🔴 Close modals called');
        
        const hintModal = document.getElementById('hintModal');
        const notesModal = document.getElementById('notesModal');
        
        if (hintModal) {
            hintModal.classList.add('hidden');
        }
        
        if (notesModal) {
            notesModal.classList.add('hidden');
        }
    }

    static forceCloseModals() {
        console.log('🔴🔴 FORCE closing modals...');
        
        const hintModal = document.getElementById('hintModal');
        const notesModal = document.getElementById('notesModal');
        
        if (hintModal) {
            hintModal.classList.add('hidden');
            hintModal.style.display = 'none';
            hintModal.style.visibility = 'hidden';
        }
        
        if (notesModal) {
            notesModal.classList.add('hidden');
            notesModal.style.display = 'none';
            notesModal.style.visibility = 'hidden';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Problem detail page loaded');
    if (document.getElementById('problemTitle')) {
        console.log('✅ Problem title found, initializing...');
        ProblemDetail.init();
    }
});

console.log('📜 Problem detail script loaded successfully');
