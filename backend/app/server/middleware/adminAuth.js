// middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const config = {
    ADMIN_JWT_SECRET: 'jwt_secret_key',
};

module.exports = async (req, res, next) => {
    try {
        // Get JWT from Authorization header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) throw new Error('Authorization required');
        // Verify JWT
        const decoded = jwt.verify(token, config.ADMIN_JWT_SECRET);

        // Check admin privileges
        const admin = await User.findById(decoded.id)
            .select('+isAdmin')
            .where('role').equals('admin')
            .where('isAdmin').equals(true);

        if (!admin) throw new Error('Admin privileges required');

        // --- Inactivity check ---
        // If token has iat (issued at) and exp (expires at), check inactivity
        // We'll use a custom claim for last activity if present, else fallback to exp/iat
        const now = Math.floor(Date.now() / 1000);
        // 2 minutes inactivity window
        const INACTIVITY_LIMIT = 60 * 60; // 60 minutes in seconds
        if (decoded.lastActivity) {
            if (now - decoded.lastActivity > INACTIVITY_LIMIT) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Session expired due to inactivity. Please log in again.'
                });
            }
        }

        req.admin = admin;
        req.adminTokenDecoded = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            status: 'fail',
            message: err.message
        });
    }
};
