const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in query results by default
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profileStats: {
        problemsSolved: { type: Number, default: 0 },
        totalSubmissions: { type: Number, default: 0 },
        acceptedSubmissions: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        maxStreak: { type: Number, default: 0 },
        lastSubmissionDate: { type: Date }
    },
    preferences: {
        preferredLanguage: { type: String, default: 'javascript' },
        theme: { type: String, enum: ['light', 'dark'], default: 'light' }
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
