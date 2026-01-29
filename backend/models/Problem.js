const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Problem title is required'],
        trim: true,
        unique: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Problem description is required'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty level is required'],
        enum: {
            values: ['Easy', 'Medium', 'Hard'],
            message: 'Difficulty must be Easy, Medium, or Hard'
        }
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Array', 'String', 'Linked List', 'Tree', 'Graph', 
            'Dynamic Programming', 'Greedy', 'Backtracking', 
            'Binary Search', 'Two Pointers', 'Hash Table',
            'Stack', 'Queue', 'Heap', 'Trie', 'Math'
        ]
    },
    examples: [{
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String }
    }],
    constraints: [{ type: String, required: true }],
    statistics: {
        totalSubmissions: { type: Number, default: 0 },
        acceptedSubmissions: { type: Number, default: 0 },
        solvedBy: { type: Number, default: 0 }
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Indexes
problemSchema.index({ difficulty: 1, category: 1 });
problemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Problem', problemSchema);
