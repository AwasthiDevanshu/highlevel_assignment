const mongoose = require('mongoose');

const bulkActionSchema = new mongoose.Schema({
  actionId: {
    type: String,
    required: true,
    unique: true
  },
  accountId: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['contact', 'company', 'lead', 'opportunity', 'task']
  },
  actionType: {
    type: String,
    required: true,
    enum: ['update', 'delete', 'create']
  },
  status: {
    type: String,
    required: true,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued'
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  totalRecords: {
    type: Number,
    required: true
  },
  processedRecords: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  skippedCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
bulkActionSchema.index({ accountId: 1, status: 1 });
bulkActionSchema.index({ actionId: 1 });
bulkActionSchema.index({ scheduledFor: 1 });

module.exports = mongoose.model('BulkAction', bulkActionSchema); 