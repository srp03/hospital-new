const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = req.params.bucket;
    const bucketDir = path.join(uploadsDir, bucket);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }
    cb(null, bucketDir);
  },
  filename: (req, file, cb) => {
    // Use the filePath from the request body, or generate one
    const filePath = req.body.filePath || `${Date.now()}-${file.originalname}`;
    cb(null, filePath);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// POST /api/storage/upload/:bucket — Upload a file
router.post('/upload/:bucket', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    res.json({
      data: {
        path: req.file.filename,
        fullPath: `${req.params.bucket}/${req.file.filename}`,
      },
      error: null
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// GET /api/storage/download/:bucket/* — Download a file
router.get('/download/:bucket/*', (req, res) => {
  try {
    const bucket = req.params.bucket;
    const filePath = req.params[0];
    const fullPath = path.join(uploadsDir, bucket, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Use res.download for a cleaner implementation that sets headers automatically
    res.download(fullPath, path.basename(filePath), (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ error: { message: 'Failed to download file' } });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// GET /api/storage/public/:bucket/* — Get public URL for a file
router.get('/public/:bucket/*', (req, res) => {
  const bucket = req.params.bucket;
  const filePath = req.params[0];
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const publicUrl = `${baseUrl}/api/storage/download/${bucket}/${filePath}`;

  res.json({
    data: { publicUrl },
    error: null
  });
});

module.exports = router;
