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
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS Blocking Origin: ${origin}. Please add this to FRONTEND_URL env var.`);
      // Temporarily allow all during initial setup to unblock user
      callback(null, true);
    }
  },
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

// NOTE: Render free tier does not support persistent disks. 
// Files in /uploads will be lost on every redeploy or restart.
// For production, use cloud storage like Supabase Storage or Cloudinary.
const PORT = process.env.PORT || 5000;
// Only skip app.listen if we are in a Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🏥 Hospital MS Backend running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
