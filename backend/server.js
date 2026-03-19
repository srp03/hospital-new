require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/query');
const storageRoutes = require('./routes/storage');
const rpcRoutes = require('./routes/rpc');
const labReportRoutes = require('./routes/labReports');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/rpc', rpcRoutes);
app.use('/api/lab-reports', labReportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hospital MS Backend running' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🏥 Hospital MS Backend running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
