const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../app/server/models/user.model');

async function migrateUsers() {
    try {
        await connectDB();

        const updateResult = await User.updateMany(
            {
                $or: [
                    { role: { $exists: false } },
                    { isAdmin: { $exists: false } },
                    { registrationDate: { $exists: false } },
                    { lastLogin: { $exists: false } },
                    { emailVerified: { $exists: false } }
    ]
            },
            {
                $set: {
                    role: 'user',
                    isAdmin: false,
                    disabled: false,
                    wishlist: [],
                    cart: [],
                    registrationDate: new Date(),
                    lastLogin: new Date(),
                    emailVerified: true
                }
            }
        );

        console.log(`Update summary:\n    Matched documents: ${updateResult.matchedCount}\n    Modified documents: ${updateResult.modifiedCount}\n`);

        const adminUpdate = await User.updateMany(
            { role: 'admin', isAdmin: true },
            {
                $set: {},
                $setOnInsert: {
                    lastLogin: new Date(),
                    registrationDate: new Date(),
                    emailVerified: true
                }
            },
            { upsert: false }
        );

        console.log(`Admin update:\n    Matched: ${adminUpdate.matchedCount}\n    Modified: ${adminUpdate.modifiedCount}\n`);

    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}

migrateUsers();
