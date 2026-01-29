const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
    code: {
        type: String,
        required: [true, 'Code is required'],
        maxlength: [50000, 'Code cannot exceed 50000 characters']
    },
    language: {
        type: String,
        required: [true, 'Programming language is required'],
        enum: ['javascript', 'python', 'java', 'cpp', 'c']
    },
    status: {
        type: String,
        required: true,
        enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error'],
        default: 'Accepted'
    },
    runtime: { type: String },
    memory: { type: String },
    submittedAt: { type: Date, default: Date.now }
});

// Indexes
submissionSchema.index({ userId: 1, submittedAt: -1 });
submissionSchema.index({ problemId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
