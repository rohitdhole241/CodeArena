-- Create users table first
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    problems_solved INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    accepted_submissions INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create registrations table
CREATE TABLE registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
);

-- Add indexes
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_users_email ON users(email);

-- Insert sample users
INSERT INTO users (full_name, username, email, password_hash, role, problems_solved, total_submissions, accepted_submissions, current_streak, max_streak) VALUES
('Admin User', 'admin', 'admin@codearena.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'admin', 25, 45, 30, 5, 7),
('John Doe', 'johndoe', 'john@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'user', 12, 28, 15, 3, 5),
('Jane Smith', 'janesmith', 'jane@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'user', 8, 18, 10, 2, 4),
('Alice Johnson', 'alicej', 'alice@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'user', 20, 35, 25, 4, 6),
('Bob Wilson', 'bobwilson', 'bob@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'user', 15, 22, 18, 3, 3);

-- Insert sample registrations
INSERT INTO registrations (full_name, username, email, password_hash, status) VALUES
('Admin User', 'admin', 'admin@codearena.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'approved'),
('John Doe', 'johndoe', 'john@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'approved'),
('Jane Smith', 'janesmith', 'jane@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'approved'),
('Alice Johnson', 'alicej', 'alice@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'approved'),
('Bob Wilson', 'bobwilson', 'bob@example.com', '$2a$12$LQv3c1yqBwEHo.jHG8YmxOJF8NJo5MJ8LQvG5VGQR5Q8J5F5Q5Q5Q', 'approved');

-- Insert sample problems
INSERT INTO problems (title, description, difficulty, category, examples, constraints, test_cases, total_submissions, accepted_submissions, solved_by, created_by) VALUES
(
    'Two Sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    'Easy',
    'Array',
    '[{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."}]',
    '["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "-10⁹ ≤ target ≤ 10⁹", "Only one valid answer exists."]',
    '[{"input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "isHidden": false}, {"input": "[3,2,4]\\n6", "expectedOutput": "[1,2]", "isHidden": false}, {"input": "[3,3]\\n6", "expectedOutput": "[0,1]", "isHidden": false}]',
    150, 135, 120, 1
),
(
    'Add Two Numbers',
    'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    'Medium',
    'Linked List',
    '[{"input": "l1 = [2,4,3], l2 = [5,6,4]", "output": "[7,0,8]", "explanation": "342 + 465 = 807."}]',
    '["The number of nodes in each linked list is in the range [1, 100].", "0 ≤ Node.val ≤ 9"]',
    '[{"input": "[2,4,3]\\n[5,6,4]", "expectedOutput": "[7,0,8]", "isHidden": false}]',
    85, 60, 55, 1
),
(
    'Longest Substring Without Repeating Characters',
    'Given a string s, find the length of the longest substring without repeating characters.',
    'Medium',
    'String',
    '[{"input": "s = \\"abcabcbb\\"", "output": "3", "explanation": "The answer is \\"abc\\", with the length of 3."}]',
    '["0 ≤ s.length ≤ 5 * 10⁴", "s consists of English letters, digits, symbols and spaces."]',
    '[{"input": "abcabcbb", "expectedOutput": "3", "isHidden": false}]',
    120, 75, 68, 1
),
(
    'Valid Parentheses',
    'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.',
    'Easy',
    'String',
    '[{"input": "s = \\"()\\""", "output": "true"}, {"input": "s = \\"()[]{}\\""", "output": "true"}, {"input": "s = \\"(]\\""', "output": "false"}]',
    '["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only ''()[]{}''."]',
    '[{"input": "()", "expectedOutput": "true", "isHidden": false}, {"input": "()[]{}", "expectedOutput": "true", "isHidden": false}, {"input": "(]", "expectedOutput": "false", "isHidden": false}]',
    200, 170, 145, 1
),
(
    'Merge Two Sorted Lists',
    'Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.',
    'Easy',
    'Linked List',
    '[{"input": "list1 = [1,2,4], list2 = [1,3,4]", "output": "[1,1,2,3,4,4]"}]',
    '["The number of nodes in both lists is in the range [0, 50].", "-100 ≤ Node.val ≤ 100"]',
    '[{"input": "[1,2,4]\\n[1,3,4]", "expectedOutput": "[1,1,2,3,4,4]", "isHidden": false}]',
    95, 85, 78, 1
);

-- Insert sample hints
INSERT INTO hints (problem_id, content, level, category, created_by) VALUES
(1, 'Think about using a hash map to store numbers you''ve seen and their indices.', 1, 'approach', 1),
(1, 'For each number, check if the complement (target - current number) exists in your hash map.', 2, 'algorithm', 1),
(2, 'Process both linked lists simultaneously, keeping track of carry values.', 1, 'approach', 1),
(3, 'Use a sliding window technique with a set to track characters in the current window.', 1, 'algorithm', 1),
(4, 'A stack data structure is perfect for matching opening and closing brackets.', 1, 'data-structure', 1),
(5, 'Compare values from both lists and always pick the smaller one for the result.', 1, 'approach', 1);

-- Insert sample submissions
INSERT INTO submissions (user_id, problem_id, code, language, status, runtime, memory, execution_time, memory_used, passed_tests, total_tests) VALUES
(2, 1, 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}', 'javascript', 'Accepted', '68 ms', '44.2 MB', 68, 44.2, 3, 3),
(3, 1, 'def twoSum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return []', 'python', 'Accepted', '52 ms', '15.1 MB', 52, 15.1, 3, 3),
(4, 2, 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef addTwoNumbers(l1, l2):\n    dummy = ListNode(0)\n    current = dummy\n    carry = 0\n    \n    while l1 or l2 or carry:\n        val1 = l1.val if l1 else 0\n        val2 = l2.val if l2 else 0\n        total = val1 + val2 + carry\n        \n        carry = total // 10\n        current.next = ListNode(total % 10)\n        current = current.next\n        \n        if l1: l1 = l1.next\n        if l2: l2 = l2.next\n    \n    return dummy.next', 'python', 'Accepted', '76 ms', '13.8 MB', 76, 13.8, 1, 1);

-- Insert solved problems relationships
INSERT INTO user_solved_problems (user_id, problem_id, best_runtime, best_memory) VALUES
(2, 1, '68 ms', '44.2 MB'),
(3, 1, '52 ms', '15.1 MB'),
(4, 2, '76 ms', '13.8 MB'),
(2, 4, '45 ms', '38.1 MB'),
(3, 4, '41 ms', '14.2 MB'),
(4, 4, '48 ms', '15.8 MB'),
(5, 1, '71 ms', '45.1 MB'),
(5, 4, '43 ms', '37.9 MB');

-- Insert sample notes
INSERT INTO notes (user_id, problem_id, content, tags) VALUES
(2, 1, 'Key insight: Use hash map for O(1) lookup. Time complexity: O(n), Space complexity: O(n)', '["hash-map", "optimization"]'),
(3, 2, 'Remember to handle carry properly. Edge cases: different length lists, final carry', '["linked-list", "carry", "edge-cases"]'),
(4, 4, 'Stack is perfect for matching brackets. Push opening brackets, pop and compare for closing ones', '["stack", "matching", "validation"]');
