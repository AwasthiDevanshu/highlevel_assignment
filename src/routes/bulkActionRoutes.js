const express = require('express');
const router = express.Router();
const bulkActionController = require('../controllers/bulkActionController');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this account, please try again later.'
});

// Apply rate limiting to all routes
router.use(limiter);

// Create a new bulk action
router.post('/', bulkActionController.createBulkAction);

// Create a new bulk action from CSV
router.post('/csv', upload.single('file'), bulkActionController.createBulkActionFromCSV);

// Get bulk action details
router.get('/:actionId', bulkActionController.getBulkAction);

// Get bulk action statistics
router.get('/:actionId/stats', bulkActionController.getBulkActionStats);

// List bulk actions with optional filters
router.get('/', bulkActionController.listBulkActions);

module.exports = router; 