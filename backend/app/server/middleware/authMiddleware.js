const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const mongoose = require('mongoose');

const config = {
    JWT_SECRET: 'jwt_secret_key',
};

exports.authenticate = async (req, res, next) => {
    try {


        const authHeader = req.headers.authorization;

        const token = authHeader.split(' ')[1];
        console.log('Extracted token:', token ? `${token.slice(0, 10)}...` : 'Empty');

        const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User account not found" });
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        };
        console.log('User attached to request:', req.user);

        next();
    } catch (error) {
        console.error(`Authentication Error: ${error.message}`);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please login again' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid authentication credentials' });
        }

        res.status(500).json({ message: 'Authentication system error' });
    }
};