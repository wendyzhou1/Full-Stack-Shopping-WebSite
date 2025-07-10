const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connecting to the local MongoDB database OldPhoneDeals
    await mongoose.connect('mongodb://localhost:27017/OldPhoneDeals', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected to OldPhoneDeals');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
