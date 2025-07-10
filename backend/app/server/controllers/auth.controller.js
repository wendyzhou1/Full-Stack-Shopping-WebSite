// auth.controller.js
const User = require('../models/user.model');
const TempUser = require('../models/TempUser.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const config = {
    JWT_SECRET: 'jwt_secret_key',
};

// Register new user with email verification
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { firstname, lastname, email, password } = req.body;

        const [existingUser, existingTemp] = await Promise.all([
            User.findOne({ email }),
            TempUser.findOne({ email })
        ]);

        if (existingUser || existingTemp) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        await TempUser.create({ firstname, lastname, email, password, verificationToken });
        const verificationUrl = `http://localhost:4200/verify-email?token=${verificationToken}`;
        await sendVerificationEmail(email, verificationUrl);

        res.status(201).json({ message: 'Verification email sent to your inbox' });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

// Verify email and create permanent user
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        const tempUser = await TempUser.findOneAndDelete({
            verificationToken: token,
            expiresAt: { $gt: Date.now() }
        });

        if (!tempUser) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        //Use the original password directly, and the pre-save middleware of the User model will encrypt it.
        await User.create({
            firstname: tempUser.firstname,
            lastname: tempUser.lastname,
            email: tempUser.email,
            password: tempUser.password,
            emailVerified: true,
            registrationDate: new Date()
        });

        res.status(200).json({ message: 'Account activated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Account activation failed', error: error.message });
    }
};


// Handle password reset initiation
exports.forgotPassword = async (req, res) => {
    try {
        // Find user by email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'No user found with this email'
            });
        }

        // Generate password reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Send password reset email
        const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(user.email, resetUrl);

        res.status(200).json({
            status: 'success',
            message: 'Password reset instructions sent to your email'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Password reset failed',
            error: error.message
        });
    }
};

// Handle password reset completion
exports.changePassword = async (req, res) => {
    try {
        console.log('Request_req_body:', req.body); // Check whether token and newPassword are passed to the backend

        const hashedToken = crypto.createHash('sha256')
            .update(req.body.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
        }

        // Print the password to be set
        console.log('Set new password:', req.body.newPassword);

        //  Setting password
        user.password = req.body.newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save(); // This triggers the pre-save bcrypt.hash

        return res.status(200).json({ status: 'success', message: 'Password has been reset' });
    } catch (error) {
        console.error('❌ Password reset failed:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Password reset failed',
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.emailVerified) {
            return res.status(404).json({
                status: 'error',
                message: 'This email is not registered. OR Email not verified. Please check your inbox.'
            });
        }

        if (user.disabled) {
            return res.status(403).json({
                status: 'error',
                message: 'Account has been disabled. Please contact support.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Incorrect password'
            });
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            config.JWT_SECRET,
            {
                expiresIn: '2h',
                algorithm: 'HS256'
            }
        );

        res.status(200).json({
            status: 'success',
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                token: token
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Login failed due to server error',
            error: error.message
        });
    }
};




// Handle user logout
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
};