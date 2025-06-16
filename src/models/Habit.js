const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
    },
    preferredTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        default: 'morning'
    },
    specificTime: Date,
    daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
    }],
    reminders: [{
        time: Date,
        sent: {
            type: Boolean,
            default: false
        }
    }],
    streak: {
        current: {
            type: Number,
            default: 0
        },
        longest: {
            type: Number,
            default: 0
        },
        lastCompleted: Date
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

habitSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Habit', habitSchema); 