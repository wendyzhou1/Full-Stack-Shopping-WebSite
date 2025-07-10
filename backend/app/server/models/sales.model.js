const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      title: { 
        type: String, 
        required: true 
      },
      price: { 
        type: Number, 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true 
      }
    }
  ],
  totalAmount: { 
    type: Number, 
    required: true 
  }
}, {
  collection: 'sales',
  versionKey: false,
  timestamps: true 
});

const Sale = mongoose.model('Sale', saleSchema, 'sales');

module.exports = Sale;
