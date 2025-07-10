//admin.routes
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { check } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const authController = require('../controllers/auth.controller');

// [Admin] Authentication
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], adminController.adminLogin);

router.use(adminAuth);

// [Admin] Get all users
router.get('/users', adminAuth, adminController.getAllUsers);
// [Admin] Search users
router.get('/users/search', adminAuth, adminController.searchUsers);
// [Admin] Get user by ID
router.get('/users/:id', adminAuth, adminController.getUserById);
// [Admin] Edit user
router.put('/users/:id', [
    adminAuth,
    check('firstname', 'First name is required').not().isEmpty(),
    check('lastname', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail()
], adminController.updateUser);
// [Admin] Disable user
router.put('/users/:id/disable', adminAuth, adminController.disableUser);
// [Admin] Enable user
router.put('/users/:id/enable', adminAuth, adminController.enableUser);
// [Admin] Delete user
router.delete('/users/:id', adminAuth, adminController.deleteUser);
// [Admin] Get user listings and reviews
router.get('/user/:id/activities', adminController.getUserListingsAndReviews);

// [Admin] Get all products
router.get('/products', adminController.getAllProductsAdmin);
// [Admin] Search products
router.get('/products/search', adminController.searchProductsAdmin);
// [Admin] Edit product
router.put('/products/:id', adminController.editProductAdmin);
// [Admin] Disable Products
router.put('/products/:id/disable', adminController.disableProductAdmin);
// [Admin] Enable Products
router.put('/products/:id/enable', adminController.enableProductAdmin);
// [Admin] Delete Product
router.delete('/products/:id', adminController.deleteProductAdmin);
// [Admin] View Product Reviews and Seller Information
router.get('/products/:id/details', adminController.getProductDetailsAdmin);

// [Admin] View all reviews
router.get('/reviews', adminController.getAllReviewsAdmin);
// [Admin] Search reviews
router.get('/reviews/search', adminController.searchReviewsAdmin);
// [Admin] Toggle review hiding 
router.patch('/reviews/toggle-visibility', adminController.toggleReviewVisibilityAdmin);
router.post('/reviews/toggle-visibility', adminController.toggleReviewVisibilityAdmin);

// [Admin] View all sales logs
router.get('/sales/logs', adminController.getAllSalesLogsAdmin);
// [Admin] Export Sales Log (JSON)
router.get('/sales/export', adminController.exportSalesLogsAdmin);
// [Admin] Export Sales Log (CSV)
router.get('/sales/export/csv', adminController.exportSalesLogsCSV);
// [Admin] View admin notification logs
router.get('/logs/notifications', adminController.getAllAdminLogs);
router.get('/user/:id/activities', adminController.getUserListingsAndReviews);

// [Admin] Read Audit Log
router.get('/audit/log', adminController.readAuditLogs);

module.exports = router;
