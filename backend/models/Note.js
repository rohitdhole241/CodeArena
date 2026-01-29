const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: [true, 'Problem ID is required']
    },
    content: {
        type: String,
        required: [true, 'Note content is required'],
        maxlength: [5000, 'Note content cannot exceed 5000 characters']
    },
    isPrivate: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes
noteSchema.index({ userId: 1, problemId: 1 }, { unique: true });
noteSchema.index({ userId: 1, updatedAt: -1 });

// Update timestamp before saving
noteSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get user notes
noteSchema.statics.getUserNotes = function(userId, problemId = null) {
    const query = { userId };
    
    if (problemId) {
        query.problemId = problemId;
    }
    
    return this.find(query)
        .populate('problemId', 'title difficulty category')
        .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Note', noteSchema);
