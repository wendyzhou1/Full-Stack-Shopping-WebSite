require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const initAdmin = require('./app/server/utils/createAdmin');
require('./app/server/models/user.model');


const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('OldPhoneDeals backend is running!');
});

initAdmin().catch((err) => {
  console.error('Admin initialization failed:', err);
});

// Routes
const productRoutes = require('./app/server/routes/product.routes');
const authRoutes = require('./app/server/routes/auth.routes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

const userRoutes = require('./app/server/routes/user.routes');
app.use('/api/users', userRoutes);

const adminRoutes = require('./app/server/routes/admin.routes');
app.use('/api/admin', adminRoutes);

const profileRoutes = require('./app/server/routes/profile.routes');
app.use('/api/profile', profileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});