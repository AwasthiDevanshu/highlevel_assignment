require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-bulk-actions',
  REDIS_URL: process.env.REDIS_URL || 'redis://redis-mojo-myaccount-mmt.mmt.mmt:6379',
  BATCH_SIZE: 1000,
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10000 // 10k requests per minute
  }
}; 