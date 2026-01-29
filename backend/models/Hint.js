const mongoose = require('mongoose');

const hintSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: [true, 'Problem ID is required']
    },
    content: {
        type: String,
        required: [true, 'Hint content is required'],
        maxlength: [1000, 'Hint content cannot exceed 1000 characters']
    },
    level: {
        type: Number,
        required: [true, 'Hint level is required'],
        min: [1, 'Hint level must be at least 1'],
        max: [5, 'Hint level cannot exceed 5']
    },
    unlockCost: {
        type: Number,
        default: 0,
        min: [0, 'Unlock cost cannot be negative']
    },
    category: {
        type: String,
        enum: ['approach', 'algorithm', 'data-structure', 'optimization', 'edge-case'],
        required: [true, 'Hint category is required']
    },
    isActive: { type: Boolean, default: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes
hintSchema.index({ problemId: 1, level: 1 });
hintSchema.index({ problemId: 1, isActive: 1 });

// Update timestamp before saving
hintSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get hints for a problem
hintSchema.statics.getProblemHints = function(problemId, maxLevel = null) {
    const query = { problemId, isActive: true };
    
    if (maxLevel) {
        query.level = { $lte: maxLevel };
    }
    
    return this.find(query).sort({ level: 1 });
};

module.exports = mongoose.model('Hint', hintSchema);
