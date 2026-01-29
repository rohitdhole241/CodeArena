const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid, user not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

module.exports = auth;
