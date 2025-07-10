const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: Number,
  comment: String,
  hidden: {
    type: Boolean,
    default: false
  }
}, { _id: true }); // Enable _id for reviews

const productSchema = new mongoose.Schema({
  title: String,
  brand: String,
  image: String,
  stock: Number,
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  price: Number,
  disabled: {
    type: Boolean,
    default: false
  },
  reviews: [reviewSchema]
}, {
  timestamps: true,
  versionKey: false
});

const Product = mongoose.model('Product', productSchema, 'products');

module.exports = Product;
