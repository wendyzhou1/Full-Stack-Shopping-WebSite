const User = require('../models/user.model');
const Product = require('../models/product.model');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendPasswordChangeConfirmationEmail } = require('../utils/email');

// Get authenticated user's profile
exports.getProfile = async (req, res) => {
    try {

        const { userId } = req.params;

        const user = await User.findById(userId)
            .select("-password -isAdmin -cart -wishlist")
            .lean();

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "success",
            data: user
        });

    } catch (err) {
        console.error('🔥 PROFILE FETCH ERROR:', {
            message: err.message,
            stack: err.stack
        });

        res.status(500).json({
            status: "error",
            message: "Profile retrieval failure",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
};

// Update user profile (with password verification)
exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "fail",
            errors: errors.array()
        });
    }

    try {
        const { firstname, lastname, email, currentPassword } = req.body;
        const { userId } = req.params;
        // Verify current password
        const user = await User.findById(userId).select("+password");
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                status: "fail",
                message: "Incorrect current password"
            });
        }

        // Update user information
        const updatedProfile = await User.findByIdAndUpdate(
            userId,
            { firstname, lastname, email },
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json({
            status: "success",
            data: updatedProfile
        });

    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Profile update failed",
            error: err.message
        });
    }
};



exports.changePassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    try {
        const { userId } = req.params;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({
                status: 'error',
                message: 'Old password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        await sendPasswordChangeConfirmationEmail(user.email);

        return res.status(200).json({
            status: 'success',
            message: 'Password updated successfully'
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Password change failed',
            error: err.message
        });
    }
};


exports.createList = async (req, res) => {
    try {
        const { userId } = req.params;
        const { title, brand, image, stock, price } = req.body;

        const product = new Product({
            title,
            brand,
            stock,
            price,
            seller: userId
        });

        await product.save();

        res.status(201).json({
            message: 'Product listed successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error.message);
        res.status(500).json({ message: 'Failed to list product', error: error.message });
    }
};

// Get listings created by user
exports.getMyLists = async (req, res) => {
    try {
        const { userId } = req.params;
        const products = await Product.find({ seller: userId });

        res.status(200).json({
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch your listed products', error: error.message });
    }
};

exports.updateListStatus = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { disabled } = req.body;
        const { userId } = req.params;

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, seller: userId },
            { disabled },
            { new: true, runValidators: true }
        ).select('-__v');

        if (!updatedProduct) {
            return res.status(404).json({
                status: 'fail',
                code: 'PRODUCT_NOT_FOUND',
                message: 'Product not found or unauthorized'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                id: updatedProduct._id,
                disabled: updatedProduct.disabled
            }
        });
    } catch (err) {
        console.error('[Status Update Error]', err);
        res.status(500).json({
            status: 'error',
            code: 'STATUS_UPDATE_FAILED',
            message: 'Failed to update product status'
        });
    }
};


exports.deleteList = async (req, res) => {
    try {
        const { userId } = req.params;
        const { id: productId } = req.params;

        const deletedProduct = await Product.findOneAndDelete({
            _id: productId,
            seller: userId
        });

        if (!deletedProduct) {
            return res.status(404).json({
                status: 'fail',
                code: 'PRODUCT_NOT_FOUND',
                message: 'Product not found or unauthorized'
            });
        }

        res.status(204).json({
            status: 'success',
            message: 'Delete Success!'
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            code: 'PRODUCT_DELETE_FAILED',
            message: 'Failed to delete product',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
};


// Get comments on listings owned by user
exports.getUserComments = async (req, res) => {
    try {
        const { userId } = req.params;
        const products = await Product.find({ seller: userId });

        const allComments = [];

        for (const product of products) {
            for (const review of product.reviews || []) {
                allComments.push({
                    productId: product._id,
                    brand: product.brand,
                    productTitle: product.title,
                    reviewerId: review.reviewer.toString(),
                    rating: review.rating,
                    comment: review.comment,
                    hidden: review.hidden
                });
            }
        }

        const reviewerIds = [...new Set(allComments.map(c => c.reviewerId))];

        const reviewers = await User.find({ _id: { $in: reviewerIds } }).select('firstname lastname');

        const reviewerMap = {};
        reviewers.forEach(user => {
            reviewerMap[user._id.toString()] = `${user.firstname} ${user.lastname}`;
        });

        const enrichedComments = allComments.map(c => ({
            ...c,
            reviewerName: reviewerMap[c.reviewerId] || 'Anonymous'
        }));

        res.status(200).json({ success: true, comments: enrichedComments });
    } catch (err) {
        console.error('getUserComments error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
};


exports.updateCommentVisibility = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const { reviewer, comment, hidden } = req.body;

        const product = await Product.findOne({ _id: productId, seller: userId });

        if (!product) {
            return res.status(404).json({
                status: 'fail',
                message: 'Product not found or unauthorized'
            });
        }

        const review = product.reviews.find(r =>
            r.reviewer.toString() === reviewer && r.comment === comment
        );

        if (!review) {
            return res.status(404).json({
                status: 'fail',
                message: 'Review not found'
            });
        }

        review.hidden = hidden;
        await product.save();

        res.status(200).json({
            status: 'success',
            message: 'Visibility update Success'
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: 'Visibility update failed',
            error: err.message
        });
    }
};