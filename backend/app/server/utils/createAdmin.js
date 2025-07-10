const User = require('../models/user.model');
const bcrypt = require('bcrypt');

// Create an admin for test
const initAdmin = async () => {
    try {
        const adminEmail = 'admin@oldphonedeals.com';
        const adminPassword = 'AdminPass123!';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            await User.create({
                firstname: 'Admin',
                lastname: 'User',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                isAdmin: true,
                emailVerified: true,
                registrationDate: new Date(),
                lastLogin: new Date(),
            });
            console.log('Admin account initialized');
        }
    } catch (err) {
        console.error('Admin initialization failed:', err);
    }
};

module.exports = initAdmin;