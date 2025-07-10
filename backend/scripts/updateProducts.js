const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../app/server/models/product.model');

const addDisabledFieldToProducts = async () => {
    await connectDB();

    try {
        // Update only documents where "disabled" does not exist
        const result = await Product.updateMany(
            { disabled: { $exists: false } },
            { $set: { disabled: false } }
        );

        console.log(`✅ Added "disabled: false" to ${result.modifiedCount} product(s).`);
    } catch (error) {
        console.error('❌ Failed to update products:', error.message);
    } finally {
        mongoose.disconnect();
    }
};

addDisabledFieldToProducts();