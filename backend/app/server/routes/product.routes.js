const express = require('express');
const router = express.Router();

const {
  getLowStockProducts,
  getBestRatedProducts,
  searchProducts,
  getProductById,
  getProductReviews,
  addReviewToProduct,
  toggleSpecificReview
} = require('../controllers/product.controller');

// Get the 5 products with the least amount in stock
router.get('/low-stock', getLowStockProducts);

// Get the 5 highest rated products
router.get('/best-rated', getBestRatedProducts);

// Search products
router.get('/search', searchProducts);

// Get Product Details
router.get('/:id', getProductById);

// Paging for reviews
router.get('/:id/reviews', getProductReviews);

//  Add new reviews
router.post('/:id/reviews', addReviewToProduct);

// Toggle review hide/show based on userId + comment
router.patch('/:id/reviews/toggle', toggleSpecificReview);

module.exports = router;
