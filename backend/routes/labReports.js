const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Directory where lab reports are stored
const labReportsDir = path.join(__dirname, '..', 'uploads', 'lab-reports');

/**
 * GET /api/lab-reports/download/:filename
 * Reliable route to download lab report files.
 * Uses res.download to force browser download behavior.
 */
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    let filePath = path.join(labReportsDir, filename);

    // 1. Try exact match
    if (fs.existsSync(filePath)) {
      return res.download(filePath, filename);
    }

    // 2. Fallback: Fuzzy matching for misnamed files (due to upload timestamp mismatch)
    // Extract timestamp from requested filename (e.g., "id-123456789.pdf" -> "123456789")
    const match = filename.match(/(\d{13})/);
    if (match) {
      const targetTs = parseInt(match[1]);
      const files = fs.readdirSync(labReportsDir);
      
      // Look for a file whose timestamp is within 2 seconds of the target
      const bestMatch = files.find(f => {
        const fMatch = f.match(/(\d{13})/);
        if (fMatch) {
          const fTs = parseInt(fMatch[1]);
          return Math.abs(fTs - targetTs) < 2000; // 2 second tolerance
        }
        return false;
      });

      if (bestMatch) {
        console.log(`Fuzzy match found: ${filename} -> ${bestMatch}`);
        filePath = path.join(labReportsDir, bestMatch);
        return res.download(filePath, bestMatch);
      }
    }

    console.error(`File not found (even with fuzzy matching): ${filename}`);
    return res.status(404).json({ error: { message: 'Lab report file not found' } });
  } catch (error) {
    console.error('Server error during download:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

module.exports = router;
