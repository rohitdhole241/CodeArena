const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
    // Generate JWT Token
    static generateToken(userId) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    // Register new user
    static async register(req, res) {
        try {
            const { fullName, username, email, password } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: existingUser.email === email 
                        ? 'Email already registered' 
                        : 'Username already taken'
                });
            }

            // Create new user
            const newUser = new User({
                fullName,
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password
            });

            await newUser.save();

            // Generate token
            const token = this.generateToken(newUser._id);

            // Log registration
            console.log(`New user registered: ${newUser.username} (${newUser.email})`);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token,
                user: {
                    id: newUser._id,
                    fullName: newUser.fullName,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    profileStats: newUser.profileStats
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.code === 11000) {
                // Duplicate key error
                const field = Object.keys(error.keyValue)[0];
                return res.status(400).json({
                    success: false,
                    message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error during registration'
            });
        }
    }

    // Login user
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user and include password for comparison
            const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account has been deactivated. Please contact support.'
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

            // Update last login time
            user.lastLoginAt = new Date();
            await user.save();

            // Generate token
            const token = this.generateToken(user._id);

            // Log successful login
            console.log(`User logged in: ${user.username} (${user.email})`);

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
                    profileStats: user.profileStats,
                    preferences: user.preferences,
                    lastLoginAt: user.lastLoginAt
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during login'
            });
        }
    }

    // Get current user profile
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user._id)
                .populate('solvedProblems.problemId', 'title difficulty category');

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
                    profileStats: user.profileStats,
                    solvedProblems: user.solvedProblems,
                    preferences: user.preferences,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching profile'
            });
        }
    }

    // Update user profile
    static async updateProfile(req, res) {
        try {
            const user = await User.findById(req.user._id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const { fullName, username, preferredLanguage, theme } = req.body;

            // Check if username is being changed and if it's available
            if (username && username.toLowerCase() !== user.username) {
                const existingUser = await User.findOne({ username: username.toLowerCase() });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already taken'
                    });
                }
                user.username = username.toLowerCase();
            }

            // Update other fields
            if (fullName) user.fullName = fullName;
            if (preferredLanguage) user.preferences.preferredLanguage = preferredLanguage;
            if (theme) user.preferences.theme = theme;

            await user.save();

            console.log(`Profile updated: ${user.username}`);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    preferences: user.preferences
                }
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during profile update'
            });
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            // Get user with password
            const user = await User.findById(req.user._id).select('+password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify current password
            const isCurrentPasswordCorrect = await user.correctPassword(currentPassword);

            if (!isCurrentPasswordCorrect) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            console.log(`Password changed: ${user.username}`);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during password change'
            });
        }
    }

    // Logout (client-side token removal)
    static logout(req, res) {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }

    // Verify token
    static async verifyToken(req, res) {
        try {
            // Token is already verified by auth middleware
            res.json({
                success: true,
                message: 'Token is valid',
                user: {
                    id: req.user._id,
                    fullName: req.user.fullName,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role
                }
            });

        } catch (error) {
            console.error('Verify token error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during token verification'
            });
        }
    }
}

module.exports = AuthController;
