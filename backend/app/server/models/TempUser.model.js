// models/TempUser.model.js
const mongoose = require('mongoose');

//Store Temporary Register User Info
// Just to achieve asynchronous registration
const tempUserSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    password: { type: String, required: true },
    verificationToken: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 3600000 // 1 hour expiration
    }
});

// Auto-delete expired documents
tempUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TempUser', tempUserSchema);