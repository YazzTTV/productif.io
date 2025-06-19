const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    whatsappId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    preferences: {
        wakeUpTime: Date,
        coffeeDelay: {
            type: Number,
            default: 90 // 1h30 en minutes
        },
        productiveHours: {
            start: Date,
            end: Date
        },
        timezone: String
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    habits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
    }],
    conversationContext: {
        type: Map,
        of: String
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

userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('User', userSchema); 