//admin.controller
const Product = require('../models/product.model');
const SalesLog = require('../models/sales.model');
const User = require('../models/user.model');
const AdminLog = require('../models/adminlog.model');
const { logAdminAction } = require('../middleware/audit.service');
const { Parser } = require('json2csv');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const path = require('path');

const { csvParser } = require('csv-parse/sync');
const fs = require('fs');

const config = {
  ADMIN_JWT_SECRET: 'jwt_secret_key',
};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    //  Find admin account
    const admin = await User.findOne({
      email,
      role: 'admin',
      isAdmin: true
    }).select('+password');

    if (!admin) {
      console.log('Admin not found:', email);
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid admin credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      console.log('Password does not match for:', email);
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid admin credentials'
      });
    }

    // Generate admin-specific token
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      { id: admin._id, role: 'admin', lastActivity: now },
      config.ADMIN_JWT_SECRET,
      { expiresIn: '2h' }
    );

    //  Return login result
    admin.lastLogin = new Date();
    await admin.save();

    await logAdminAction(req, {
      type: 'LOGIN',
      id: admin._id,
      status: 'SUCCESS'
    });

    res.status(200).json({
      status: 'success',
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email
        }
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Admin login failed'
    });
  }
};


// Get all users (Including last login and registration time)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sortBy || 'registrationDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Remove the role filter so all users are included
    const query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstname: searchRegex },
        { lastname: searchRegex },
        { email: searchRegex }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('firstname lastname email role registrationDate lastLogin disabled')
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    await logAdminAction(req, {
      type: 'GET_ALL_USER',
      status: 'SUCCESS'
    });

    res.status(200).json({
      status: 'success',
      data: users.map(user => ({
        ...user,
        id: user._id
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user list'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -passwordResetToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Get listings for this user
    const listings = await Product.find({ seller: user._id }).select('title price');
    // Find all reviews by this user across all products, and populate product title
    const productsWithReviews = await Product.find({ 'reviews.reviewer': user._id })
      .select('reviews title')
      .populate('reviews.reviewer', 'firstname lastname');
    let reviews = [];
    productsWithReviews.forEach(product => {
      product.reviews.forEach(r => {
        if (r.reviewer && r.reviewer._id && r.reviewer._id.toString() === user._id.toString()) {
          reviews.push({
            comment: r.comment,
            rating: r.rating,
            product: product._id,
            productTitle: product.title,
            reviewerName: r.reviewer.firstname + ' ' + r.reviewer.lastname
          });
        }
      });
    });
    // Get all purchases (sales logs where user is buyer)
    const salesLogs = await SalesLog.find({ buyer: user._id })
      .select('items createdAt totalAmount')
      .lean();
    // Format purchased items, include product title
    const purchased = salesLogs.flatMap(log =>
      log.items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        purchasedAt: log.createdAt,
        totalAmount: log.totalAmount
      }))
    );

    await logAdminAction(req, {
      type: 'USER_GET',
      id: user._id,
      status: 'SUCCESS'
    });

    res.status(200).json({
      ...user.toObject(),
      registrationDate: user.registrationDate?.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      listings,
      reviews,
      purchased
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { firstname, lastname, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstname, lastname, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAdminAction(req, {
      type: 'USER_UPDATE_PROFILE',
      id: user._id,
      status: 'SUCCESS'
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Direct password update (requires admin auth middleware in routes)
    user.password = req.body.newPassword;
    await user.save();

    await logAdminAction(req, {
      type: 'USER_UPDATE_PASSWORD',
      id: user._id,
      status: 'SUCCESS'
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed by admin'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Password change failed'
    });
  }
};

// Disable user
const disableUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { disabled: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAdminAction(req, {
      type: 'USER_DISABLE',
      id: user._id,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: 'User disabled successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enable user (stop disabling)
const enableUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { disabled: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAdminAction(req, {
      type: 'USER_ENABLE',
      targetId: user._id,
      afterState: user.disabled,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: 'User enabled successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin || user.role === 'admin') {
      await logAdminAction(req, {
        type: 'USER_DELETE',
        id: req.params.id,
        status: 'FAILED',
        error: 'Attempt to delete admin user'
      });

      return res.status(403).json({
        status: 'fail',
        message: 'Cannot delete administrator accounts'
      });
    }

    await logAdminAction(req, {
      type: 'USER_DELETE',
      id: req.params.id,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: 'Keyword is required for search.' });
    }

    const regex = new RegExp(keyword, 'i');

    const users = await User.find({
      $or: [
        { firstname: { $regex: regex } },
        { lastname: { $regex: regex } },
        { email: { $regex: regex } }
      ]
    }).select('-password -verificationToken -passwordResetToken');

    await logAdminAction(req, {
      type: 'USER_SEARCH',
      status: 'SUCCESS'
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to search users.', error: error.message });
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const keyword = req.query.keyword || '';
    const query = {};
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } }
      ];
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('title brand price stock disabled')
    ]);

    await logAdminAction(req, {
      type: 'PRODUCT_GET',
      status: 'SUCCESS'
    });

    res.status(200).json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    await logAdminAction(req, {
      type: 'PRODUCT_GET',
      status: 'FAIL',
      error: err.message
    });
    res.status(500).json({ error: 'Failed to fetch products for admin.' });
  }
};

  
const searchProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const keyword = req.query.keyword || '';
    const query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } }
      ];
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('title brand price stock disabled')
    ]);

    await logAdminAction(req, {
      type: 'PRODUCT_SEARCH',
      status: 'SUCCESS'
    });

    res.status(200).json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);

    await logAdminAction(req, {
      type: 'PRODUCT_SEARCH',
      status: 'FAIL',
      error: err.message
    });

    res.status(500).json({ error: 'Failed to search products for admin.' });
  }
};


const editProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, stock } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (title !== undefined) product.title = title;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;

    await product.save();

    await logAdminAction(req, {
      type: 'PRODUCT_EDIT',
      id: id,
      status: 'SUCCESS'
    });

    res.status(200).json({
      message: 'Product updated successfully.',
      product: {
        _id: product._id,
        title: product.title,
        price: product.price,
        stock: product.stock,
        disabled: product.disabled
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
};



const disableProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    product.disabled = true;

    await product.save();

    await logAdminAction(req, {
      type: 'PRODUCT_DISABLE',
      id: id,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: 'Product disabled successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to disable product.' });
  }
};


const enableProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    product.disabled = false;

    await product.save();

    await logAdminAction(req, {
      type: 'PRODUCT_ENABLE',
      id: id,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: 'Product enabled successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enable product.' });
  }
};


const deleteProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await logAdminAction(req, {
      type: 'PRODUCT_DELETE',
      id: id,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: 'Product deleted successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};


const getProductDetailsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('seller', 'firstname lastname email')
      .populate('reviews.reviewer', 'firstname lastname');

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const reviews = product.reviews.map(review => ({
      reviewerName: review.reviewer ? `${review.reviewer.firstname} ${review.reviewer.lastname}` : 'Unknown',
      rating: review.rating,
      comment: review.comment,
      hidden: review.hidden
    }));

    await logAdminAction(req, {
      type: 'PRODUCT_GET_DETAIL',
      id: id,
      status: 'SUCCESS'
    });

    res.status(200).json({
      seller: product.seller ? {
        firstname: product.seller.firstname,
        lastname: product.seller.lastname,
        email: product.seller.email
      } : null,
      reviews: reviews
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product details for admin.' });
  }
};


const getAllReviewsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find({})
      .populate('reviews.reviewer', 'firstname lastname')
      .select('title reviews');

    const allReviews = [];
    products.forEach((product) => {
      product.reviews.forEach((review, idx) => {
        allReviews.push({
          _id: review._id || `${product._id}_${idx}`,
          user: review.reviewer
            ? {
                _id: review.reviewer._id,
                firstname: review.reviewer.firstname,
                lastname: review.reviewer.lastname,
              }
            : { _id: '', firstname: 'Unknown', lastname: '' },
          product: { _id: product._id, title: product.title },
          rating: review.rating,
          comment: review.comment,
          hidden: review.hidden,
        });
      });
    });

    const total = allReviews.length;
    const paginated = allReviews.slice(skip, skip + limit);

    await logAdminAction(req, {
      type: 'REVIEW_GET',
      status: 'SUCCESS',
    });

    res.status(200).json({
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);

    await logAdminAction(req, {
      type: 'REVIEW_GET',
      status: 'FAIL',
      error: err.message,
    });

    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};


const searchReviewsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword || '';

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required for search.' });
    }

    const regex = new RegExp(keyword, 'i');
    const products = await Product.find({})
      .populate('reviews.reviewer', 'firstname lastname')
      .select('title reviews');

    let matchedReviews = [];

    products.forEach((product) => {
      product.reviews.forEach((review, idx) => {
        const reviewerName = review.reviewer
          ? `${review.reviewer.firstname} ${review.reviewer.lastname}`
          : 'Unknown';
        if (
          regex.test(reviewerName) ||
          regex.test(review.comment) ||
          regex.test(product.title)
        ) {
          matchedReviews.push({
            _id: review._id || `${product._id}_${idx}`,
            user: review.reviewer
              ? {
                  _id: review.reviewer._id,
                  firstname: review.reviewer.firstname,
                  lastname: review.reviewer.lastname,
                }
              : { _id: '', firstname: 'Unknown', lastname: '' },
            product: { _id: product._id, title: product.title },
            rating: review.rating,
            comment: review.comment,
            hidden: review.hidden,
          });
        }
      });
    });

    const total = matchedReviews.length;
    const paginated = matchedReviews.slice(skip, skip + limit);

    await logAdminAction(req, {
      type: 'REVIEW_SEARCH',
      status: 'SUCCESS',
      keyword: keyword,
    });

    res.status(200).json({
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);

    await logAdminAction(req, {
      type: 'REVIEW_SEARCH',
      status: 'FAIL',
      error: err.message,
    });

    res.status(500).json({ error: 'Failed to search reviews.' });
  }
};


const toggleReviewVisibilityAdmin = async (req, res) => {
  try {
    const { productId, reviewerId, comment, hidden } = req.body;

    if (!productId || !reviewerId || !comment || typeof hidden !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const review = product.reviews.find(
      r => r.reviewer.toString() === reviewerId && r.comment === comment
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    review.hidden = hidden;

    await product.save();

    await logAdminAction(req, {
      type: 'Review_visibility',
      id: productId,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: `Review visibility updated to ${hidden ? 'hidden' : 'visible'}.` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle review visibility.' });
  }
};

const getAllSalesLogsAdmin = async (req, res) => {
  try {
    const salesLogs = await SalesLog.find({})
      .populate('buyer', 'firstname lastname')
      .sort({ createdAt: -1 });

    const formattedLogs = salesLogs.map(log => ({
      id: log._id,
      timestamp: log.createdAt,
      buyer: log.buyer ? { firstname: log.buyer.firstname, lastname: log.buyer.lastname } : { firstname: 'Unknown', lastname: '' },
      items: log.items.map(item => ({
        product: { title: item.title },
        quantity: item.quantity
      })),
      total: log.totalAmount
    }));

    await logAdminAction(req, {
      type: 'SALELOG_GET',
      status: 'SUCCESS'
    });

    res.status(200).json(formattedLogs);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sales logs.' });
  }
};


const exportSalesLogsAdmin = async (req, res) => {
  try {
    const salesLogs = await SalesLog.find({})
      .populate('buyer', 'firstname lastname')
      .sort({ createdAt: -1 });

    const exportData = salesLogs.map(log => ({
      id: log._id,
      timestamp: log.createdAt,
      buyerName: log.buyer ? `${log.buyer.firstname} ${log.buyer.lastname}` : 'Unknown',
      items: log.items,
      totalAmount: log.totalAmount
    }));

    res.setHeader('Content-Disposition', 'attachment; filename="sales_logs.json"');
    res.setHeader('Content-Type', 'application/json');

    await logAdminAction(req, {
      type: 'SALELOG_EXPORT',
      status: 'SUCCESS'
    });

    res.status(200).send(JSON.stringify(exportData, null, 2));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export sales logs.' });
  }
};


const exportSalesLogsCSV = async (req, res) => {
  try {
    const salesLogs = await SalesLog.find({})
      .populate('buyer', 'firstname lastname')
      .sort({ createdAt: -1 });

    const exportData = salesLogs.map(log => ({
      id: log._id,
      timestamp: log.createdAt,
      buyerName: log.buyer ? `${log.buyer.firstname} ${log.buyer.lastname}` : 'Unknown',
      totalAmount: log.totalAmount,
      items: log.items.map(item => `${item.title} (x${item.quantity})`).join('; ')
    }));

    const fields = ['id', 'timestamp', 'buyerName', 'totalAmount', 'items'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(exportData);

    res.header('Content-Type', 'text/csv');
    res.attachment('sales_logs.csv');
    res.send(csv);

    await logAdminAction(req, {
      type: 'SALELOG_EXPORT_CSV',
      status: 'SUCCESS'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export sales logs as CSV.' });
  }
};


const getAllAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find({})
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin logs.' });
  }
};


const readAuditLogs = (req, res) => {
  const csvPath = path.join(__dirname, '../data/audit_log.csv');

  try {
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Log not exist'
      });
    }

    const csvData = fs.readFileSync(csvPath, 'utf8');

    res.header('Content-Type', 'text/csv');
    res.attachment('audit_log.csv');

    return res.send(csvData);

  } catch (error) {
    console.error('Read log fail', error);
    return res.status(500).json({
      status: 'error',
      message: 'Read log fail'
    });
  }
};

const getUserListingsAndReviews = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('firstname lastname email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const listings = await Product.find({ seller: userId }).select('title brand price stock disabled');

    const salesLogs = await SalesLog.find({ buyer: userId })
      .select('items createdAt totalAmount')
      .lean();
    const purchased = salesLogs.flatMap(log =>
      log.items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        purchasedAt: log.createdAt,
        totalAmount: log.totalAmount
      }))
    );

    const allProducts = await Product.find({ 'reviews.reviewer': userId }).select('title reviews');
    const userReviews = [];

    allProducts.forEach(product => {
      product.reviews.forEach(review => {
        if (review.reviewer.toString() === userId) {
          userReviews.push({
            productTitle: product.title,
            rating: review.rating,
            comment: review.comment,
            hidden: review.hidden
          });
        }
      });
    });

    await logAdminAction(req, {
      type: 'GET_LIST_REVIEW',
      id: user._id,
      status: 'SUCCESS'
    });

    res.json({
      user: {
        id: user._id,
        name: `${user.firstname} ${user.lastname}`,
        email: user.email
      },
      listings,
      reviews: userReviews,
      purchased
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user listings and reviews.' });
  }
};

module.exports = {
  adminLogin,
  getAllUsers,
  changeUserPassword,
  getUserById,
  updateUser,
  disableUser,
  enableUser,
  deleteUser,
  searchUsers,
  getAllProductsAdmin,
  searchProductsAdmin,
  editProductAdmin,
  disableProductAdmin,
  enableProductAdmin,
  deleteProductAdmin,
  getProductDetailsAdmin,
  getAllReviewsAdmin,
  searchReviewsAdmin,
  toggleReviewVisibilityAdmin,
  getAllSalesLogsAdmin,
  exportSalesLogsAdmin,
  exportSalesLogsCSV,
  getAllAdminLogs,
  readAuditLogs,
  getUserListingsAndReviews
};
