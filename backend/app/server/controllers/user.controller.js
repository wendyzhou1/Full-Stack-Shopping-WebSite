const Product = require('../models/product.model');
const User = require('../models/user.model');
const Sale = require('../models/sales.model');
const AdminLog = require('../models/adminlog.model');

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { userId } = req.params;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'ProductId and quantity are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }


    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }


    const cartItem = user.cart.find(item => item.product.toString() === productId);

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();

    res.status(200).json({ message: 'Product added to cart successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product to cart.' });
  }
};

const checkWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ inWishlist: false });

    const exists = user.wishlist.includes(productId);
    res.json({ inWishlist: exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ inWishlist: false });
  }
};
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: 'cart.product',
      select: 'title price brand stock'
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const formattedCart = user.cart.map(item => ({
      productId: item.product?._id?.toString(),
      title: item.product?.title || 'Unknown',
      price: item.product?.price || 0,
      brand: item.product?.brand || 'Unknown',
      stock: item.product?.stock || 0,
      quantity: item.quantity
    }));

    res.json(formattedCart);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity is required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ error: 'Quantity exceeds available stock.' });
    }

    const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productId);
    if (cartItemIndex === -1) {
      return res.status(404).json({ error: 'Product not found in cart.' });
    }

    if (quantity === 0) {
      user.cart.splice(cartItemIndex, 1);
    } else {
      user.cart[cartItemIndex].quantity = quantity;
    }

    await user.save();

    res.json({ message: quantity === 0 ? 'Product removed from cart.' : 'Cart item updated successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cart item.' });
  }
};


const removeCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productId);

    if (cartItemIndex === -1) {
      return res.status(404).json({ error: 'Product not found in cart.' });
    }

    user.cart.splice(cartItemIndex, 1);

    await user.save();

    res.json({ message: 'Product removed from cart successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove cart item.' });
  }
};


const addToWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'ProductId is required.' });
    }


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }


    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }


    const alreadyExists = user.wishlist.includes(productId);
    if (alreadyExists) {
      return res.status(400).json({ error: 'Product already in wishlist.' });
    }


    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ message: 'Product added to wishlist successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product to wishlist.' });
  }
};


const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: 'wishlist',
      select: 'title price image brand'
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user.wishlist);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
};


const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const index = user.wishlist.findIndex(
      item => item.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found in wishlist.' });
    }

    user.wishlist.splice(index, 1);

    await user.save();

    res.json({ message: 'Product removed from wishlist successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove product from wishlist.' });
  }
};


const checkoutCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('cart.product');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    let totalAmount = 0;
    const saleItems = [];

    for (const cartItem of user.cart) {
      const product = cartItem.product;

      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
        });
      }

      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -cartItem.quantity } }
      );

      totalAmount += cartItem.quantity * product.price;

      saleItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: cartItem.quantity
      });
    }

    const newSale = new Sale({
      buyer: user._id,
      items: saleItems,
      totalAmount: totalAmount
    });

    await newSale.save();

    // --- Admin Log: Order Placed ---
    await AdminLog.create({
      type: 'order_placed',
      message: `Order placed by ${user.firstname || user.email || user._id}`,
      data: {
        userId: user._id,
        saleId: newSale._id,
        totalAmount,
        items: saleItems,
        date: new Date()
      }
    });
    // --- End Admin Log ---

    user.cart = [];
    await user.save();

    res.status(200).json({
      message: 'Checkout successful!',
      saleId: newSale._id,
      totalAmount: totalAmount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Checkout failed.' });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  checkoutCart,
  checkWishlist
};