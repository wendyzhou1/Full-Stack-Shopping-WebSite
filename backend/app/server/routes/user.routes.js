const express = require('express');
const router = express.Router();

const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  checkoutCart,
  checkWishlist
} = require('../controllers/user.controller');

// Add to Cart
router.post('/:userId/cart', addToCart);

// View Cart
router.get('/:userId/cart', getCart);

router.get('/:userId/wishlist/:productId', checkWishlist);

// Modify the number of products in shopping cart
router.patch('/:userId/cart/:productId', updateCartItem);

// Delete Shopping Cart products
router.delete('/:userId/cart/:productId', removeCartItem);

// Add products to Wishlist
router.post('/:userId/wishlist', addToWishlist);

// View Wishlist
router.get('/:userId/wishlist', getWishlist);

// Delete Wish List products
router.delete('/:userId/wishlist/:productId', removeFromWishlist);

// User Checkout
router.post('/:userId/checkout', checkoutCart);

module.exports = router;
