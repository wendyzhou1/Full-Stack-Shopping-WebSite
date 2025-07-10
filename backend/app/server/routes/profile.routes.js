const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getMyLists,
    getUserComments,
    changePassword,
    createList,
    updateListStatus,
    deleteList,
    updateCommentVisibility
} = require('../controllers/profile.controller');
const { check } = require('express-validator');

const allowedBrands = ['Samsung', 'Apple', 'HTC', 'Huawei', 'Nokia', 'LG', 'Motorola', 'Sony', 'BlackBerry'];

/**
 * Profile Management Routes
 */
router.get('/profile/:userId', getProfile);
// Update profile information

router.patch('/update-profile/:userId', [
    check('firstname', 'First name is required').trim().notEmpty(),
    check('lastname', 'Last name is required').trim().notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('currentPassword', 'Current password is required').notEmpty()
], updateProfile);

//password
router.post('/:userId/change-password', [
    check('oldPassword', 'Current password is required').notEmpty(),
    check('newPassword', 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, 'i')
], changePassword);


/**
 * List Management Routes
 */
router.post('/lists/:userId', [
    check('title', 'Title is required').trim().notEmpty(),
    check('brand', 'Brand is required').trim().notEmpty()
        .isIn(allowedBrands).withMessage(`Brand must be one of: ${allowedBrands.join(', ')}`),
    check('price', 'Valid price is required').isFloat({ min: 0 }),
    check('stock', 'Stock must be a non-negative integer').isInt({ min: 0 }),
], createList);

router.get('/lists/:userId/getList', getMyLists);

router.patch('/lists/:userId/:id/status', updateListStatus);

router.delete('/lists/:userId/:id', deleteList);


/**
 * Comment Management Routes
 */
router.get('/comments/:userId', getUserComments);

router.patch('/comments/:userId/:productId', [
    check('hidden', 'Visibility status is required').isBoolean()
], updateCommentVisibility);

module.exports = router;