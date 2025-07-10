const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const User = require('../app/server/models/user.model');

// Configuration
const PLAIN_TEXT_PASSWORD = 'temporaryPassword123!'; // Replace with actual password
const SALT_ROUNDS = 10;

async function resetUserPasswords() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Generate hashed password
        const hashedPassword = await bcrypt.hash(PLAIN_TEXT_PASSWORD, SALT_ROUNDS);

        // Update all users with 'user' role
        const result = await User.updateMany(
            { role: 'user' }, // Filter: only target users with 'user' role
            { $set: { password: hashedPassword } } // Update: set hashed password
        );

        // Output results
        console.log(`Successfully updated passwords for ${result.modifiedCount} users`);
        console.log(`Matched ${result.matchedCount} user documents`);

    } catch (error) {
        console.error('Password reset failed:', error);
        process.exit(1);
    } finally {
        // Close connection
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}

// Execute the password reset
resetUserPasswords();