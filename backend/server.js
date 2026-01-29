const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codearena';

console.log('🔧 CodeArena starting with database integration...');

// User Schema
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profileStats: {
        problemsSolved: { type: Number, default: 0 },
        totalSubmissions: { type: Number, default: 0 },
        acceptedSubmissions: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 }
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.correctPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Problem Schema
const problemSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    category: { type: String, required: true },
    examples: [{ input: String, output: String, explanation: String }],
    constraints: [String],
    statistics: {
        totalSubmissions: { type: Number, default: 0 },
        acceptedSubmissions: { type: Number, default: 0 },
        solvedBy: { type: Number, default: 0 }
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Problem = mongoose.model('Problem', problemSchema);

// Database connection function
async function connectDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log('📍 URI:', MONGODB_URI);
        
        await mongoose.connect(MONGODB_URI);
        
        console.log('✅ Successfully connected to MongoDB!');
        console.log(`📍 Database: ${mongoose.connection.name}`);
        console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        
        // Create default data
        await createDefaultData();
        return true;
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('💡 Make sure MongoDB service is running: net start MongoDB');
        return false;
    }
}

// Create default users and problems
async function createDefaultData() {
    try {
        // Check admin user
        const adminExists = await User.findOne({ email: 'admin@codearena.com' });
        if (!adminExists) {
            const admin = new User({
                fullName: 'Admin User',
                username: 'admin',
                email: 'admin@codearena.com',
                password: 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('👤 Admin user created');
        } else {
            console.log('👤 Admin user exists');
        }

        // Check test user
        const userExists = await User.findOne({ email: 'user@codearena.com' });
        if (!userExists) {
            const testUser = new User({
                fullName: 'Test User',
                username: 'testuser',
                email: 'user@codearena.com',
                password: 'user123',
                role: 'user'
            });
            await testUser.save();
            console.log('👤 Test user created');
        } else {
            console.log('👤 Test user exists');
        }

        // Create multiple default problems
        await createDefaultProblems();
        
    } catch (error) {
        console.error('Error managing default users:', error.message);
    }
}

// Create multiple problems
async function createDefaultProblems() {
    const defaultProblems = [
        {
            id: 1,
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
        {
            id: 2,
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
        {
            id: 3,
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
        {
            id: 4,
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
        {
            id: 5,
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
    ];

    for (const problemData of defaultProblems) {
        try {
            const problemExists = await Problem.findOne({ title: problemData.title });
            if (!problemExists) {
                const problem = new Problem(problemData);
                await problem.save();
                console.log(`📝 Created problem: ${problemData.title}`);
            }
        } catch (error) {
            console.error(`Error creating problem ${problemData.title}:`, error.message);
        }
    }
}

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const dbName = mongoose.connection.name || 'N/A';
    
    res.status(200).json({
        status: 'OK',
        message: 'CodeArena server is running',
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            name: dbName,
            host: mongoose.connection.host || 'N/A'
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📝 Registration attempt:', req.body.email);
        
        const { fullName, username, email, password } = req.body;
        
        // Validation
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.log('❌ Database not connected during registration');
            return res.status(500).json({
                success: false,
                message: 'Database connection error. Please try again.'
            });
        }

        // Create new user
        const newUser = new User({
            fullName,
            username,
            email,
            password
        });
        
        await newUser.save();
        console.log('✅ User registered successfully:', newUser.email);
        console.log('💾 User saved to MongoDB database');
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully and saved to database',
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body.email);
        
        const { email, password } = req.body;
        
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                success: false,
                message: 'Database connection error. Please try again.'
            });
        }
        
        // Find user with password included
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Verify password
        const isPasswordCorrect = await user.correctPassword(password);
        
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
        
        console.log('✅ User logged in successfully:', user.email);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileStats: user.profileStats
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Get all problems
app.get('/api/problems', async (req, res) => {
    try {
        console.log('📝 Fetching all problems...');
        
        const problems = await Problem.find({ isActive: true }).sort({ id: 1 });
        
        console.log(`✅ Found ${problems.length} problems`);

        res.json({
            success: true,
            data: problems.map(problem => ({
                _id: problem._id,
                id: problem.id,
                title: problem.title,
                difficulty: problem.difficulty,
                category: problem.category,
                description: problem.description.substring(0, 150) + '...', // Truncate for list
                statistics: problem.statistics
            }))
        });

    } catch (error) {
        console.error('❌ Error fetching problems:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching problems'
        });
    }
});

// Get individual problem by ID
app.get('/api/problems/:id', async (req, res) => {
    try {
        const problemId = req.params.id;
        console.log(`📝 Fetching problem with ID: ${problemId}`);
        
        // Find problem by MongoDB ObjectId or by custom id field
        let problem;
        if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
            // It's a valid MongoDB ObjectId
            problem = await Problem.findById(problemId);
        } else {
            // Try to find by custom id field
            problem = await Problem.findOne({ id: parseInt(problemId) });
        }

        if (!problem) {
            console.log(`❌ Problem not found: ${problemId}`);
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        console.log(`✅ Found problem: ${problem.title}`);

        res.json({
            success: true,
            data: {
                _id: problem._id,
                id: problem.id,
                title: problem.title,
                difficulty: problem.difficulty,
                category: problem.category,
                description: problem.description,
                examples: problem.examples || [],
                constraints: problem.constraints || [],
                statistics: problem.statistics || { solvedBy: 0 }
            }
        });

    } catch (error) {
        console.error('❌ Error fetching problem:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching problem'
        });
    }
});

// Get user profile endpoint
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileStats: user.profileStats
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// Serve frontend pages
const serveHTML = (filename) => (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', filename));
};

app.get('/', serveHTML('index.html'));
app.get('/login', serveHTML('login.html'));
app.get('/register', serveHTML('register.html'));
app.get('/dashboard', serveHTML('dashboard.html'));
app.get('/problems', serveHTML('problems.html'));
app.get('/problem-detail.html', serveHTML('problem-detail.html'));
app.get('/submissions', serveHTML('submissions.html'));
app.get('/admin', serveHTML('admin.html'));

// Fallback for SPA
app.use('*', serveHTML('index.html'));

// Start server
const server = app.listen(PORT, async () => {
    console.log('\n🚀 CodeArena Server Starting...');
    console.log('====================================');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
    console.log('====================================\n');
    
    // Attempt database connection
    const dbConnected = await connectDatabase();
    
    if (dbConnected) {
        console.log('\n====================================');
        console.log('🎯 Ready for testing!');
        console.log('Test Accounts:');
        console.log('  👤 Admin: admin@codearena.com / admin123');
        console.log('  👤 User: user@codearena.com / user123');
        console.log('====================================\n');
    } else {
        console.log('\n⚠️  Server running without database');
        console.log('💡 To fix: Run "net start MongoDB" as administrator\n');
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down server...');
    server.close(async () => {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('📅 Database disconnected');
        }
        console.log('✅ Shutdown complete');
        process.exit(0);
    });
});

module.exports = app;
