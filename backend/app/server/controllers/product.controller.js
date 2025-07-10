const Product = require('../models/product.model');
const User = require('../models/user.model');

const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      stock: { $gt: 0 },
      disabled: { $ne: true }
    })
      .sort({ stock: 1 })
      .limit(5)
      .select('title image price stock brand');

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low-stock products' });
  }
};

const getBestRatedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $match: {
          disabled: { $ne: true },
          "reviews.1": { $exists: true }
        }
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" }
        }
      },
      { $sort: { avgRating: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          image: 1,
          avgRating: 1,
          brand: 1
        }
      }
    ]);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch best rated products' });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { title, brand, maxPrice, sort } = req.query;

    const query = {
      disabled: { $ne: true }
    };

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (brand) {
      query.brand = brand;
    }

    if (maxPrice) {
      query.price = { $lte: parseFloat(maxPrice) };
    }

    let sortOption = {};
    if (sort === 'asc') {
      sortOption.price = 1;
    } else if (sort === 'desc') {
      sortOption.price = -1;
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .select('title image price stock brand');

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'seller',
        select: 'firstname lastname'
      });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      _id: product._id,
      title: product.title,
      brand: product.brand,
      image: product.image,
      stock: product.stock,
      price: product.price,
      sellerName: product.seller ? `${product.seller.firstname} ${product.seller.lastname}` : 'Unknown'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
};


const getProductReviews = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 3;
    const skip = (page - 1) * limit;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const totalCount = product.reviews.length;

    const paginatedReviews = product.reviews
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(skip, skip + limit);

    const reviewerIds = paginatedReviews.map(review => review.reviewer);

    const reviewers = await User.find({ _id: { $in: reviewerIds } })
      .select('firstname lastname');

    const reviewerMap = {};
    reviewers.forEach(user => {
      reviewerMap[user._id.toString()] = `${user.firstname} ${user.lastname}`;
    });

    const formattedReviews = paginatedReviews.map(review => ({
      reviewer: review.reviewer,
      reviewerName: reviewerMap[review.reviewer.toString()] || 'Unknown',
      rating: review.rating,
      comment: review.comment,
      hidden: review.hidden
    }));

    res.json({
      totalCount,
      reviews: formattedReviews
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

const addReviewToProduct = async (req, res) => {
  try {
    const { reviewer, rating, comment, hidden } = req.body;

    if (!reviewer || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newReview = {
      reviewer,
      rating,
      comment,
      hidden: typeof hidden === 'boolean' ? hidden : false
    };

    product.reviews.push(newReview);
    await product.save();

    res.status(201).json({ message: 'Review added successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add review' });
  }
};



const toggleSpecificReview = async (req, res) => {
  try {
    const { userId, comment, hidden } = req.body;
    const { id: productId } = req.params;

    if (!userId || !comment || typeof hidden !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid required fields (userId, comment, hidden)' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const review = product.reviews.find(r =>
      r.reviewer.toString() === userId && r.comment === comment
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.hidden = hidden;

    await product.save();

    res.json({ message: `Review has been ${hidden ? 'hidden' : 'shown'} successfully.` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle review visibility' });
  }
};


module.exports = {
  getLowStockProducts,
  getBestRatedProducts,
  searchProducts,
  getProductById,
  getProductReviews,
  addReviewToProduct,
  toggleSpecificReview
};
