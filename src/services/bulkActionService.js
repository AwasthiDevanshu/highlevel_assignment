const { v4: uuidv4 } = require('uuid');
const Queue = require('bull');
const BulkAction = require('../models/BulkAction');
const Contact = require('../models/Contact');
const config = require('../config/config');

class BulkActionService {
  constructor() {
    this.bulkActionQueue = new Queue('bulk-actions', config.REDIS_URL);
    this.setupQueueProcessors();
    this.setupQueueEvents();
  }

  setupQueueEvents() {
    this.bulkActionQueue.on('error', (error) => {
      console.error('Queue error:', error);
    });

    this.bulkActionQueue.on('waiting', (jobId) => {
      console.log(`Job ${jobId} is waiting`);
    });

    this.bulkActionQueue.on('active', (job) => {
      console.log(`Job ${job.id} is now active`);
    });

    this.bulkActionQueue.on('completed', (job) => {
      console.log(`Job ${job.id} has completed`);
    });

    this.bulkActionQueue.on('failed', (job, error) => {
      console.error(`Job ${job.id} has failed:`, error);
    });
  }

  setupQueueProcessors() {
    this.bulkActionQueue.process(async (job) => {
      console.log(`Processing job ${job.id}`);
      const { actionId } = job.data;
      const bulkAction = await BulkAction.findOne({ actionId });

      if (!bulkAction) {
        throw new Error('Bulk action not found');
      }

      try {
        await this.processBulkAction(bulkAction);
      } catch (error) {
        console.error(`Error processing bulk action ${actionId}:`, error);
        await this.handleBulkActionError(bulkAction, error);
      }
    });
  }

  async createBulkAction(accountId, entityType, actionType, data, scheduledFor = null) {
    const actionId = uuidv4();
    const totalRecords = data.length;

    const bulkAction = new BulkAction({
      actionId,
      accountId,
      entityType,
      actionType,
      totalRecords,
      scheduledFor,
      metadata: { data }
    });

    await bulkAction.save();

    if (!scheduledFor) {
      await this.bulkActionQueue.add({ actionId });
    } else {
      await this.bulkActionQueue.add({ actionId }, { delay: scheduledFor.getTime() - Date.now() });
    }

    return bulkAction;
  }

  async processBulkAction(bulkAction) {
    const { actionId, entityType, actionType, metadata } = bulkAction;
    
    await BulkAction.updateOne(
      { actionId },
      { $set: { status: 'processing' } }
    );

    const batchSize = config.BATCH_SIZE;
    const data = metadata.data;
    const totalBatches = Math.ceil(data.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, data.length);
      const batch = data.slice(start, end);

      await this.processBatch(batch, entityType, actionType, bulkAction);
    }

    await BulkAction.updateOne(
      { actionId },
      { 
        $set: { 
          status: 'completed',
          updatedAt: new Date()
        }
      }
    );
  }

  async processBatch(batch, entityType, actionType, bulkAction) {
    const { actionId } = bulkAction;
    const processedEmails = new Set();
    const updates = [];

    for (const item of batch) {
      if (processedEmails.has(item.email)) {
        await this.updateBulkActionStats(actionId, 'skipped');
        continue;
      }

      processedEmails.add(item.email);

      try {
        switch (actionType) {
          case 'update':
            await this.updateContact(item);
            await this.updateBulkActionStats(actionId, 'success');
            break;
          // Add other action types here
          default:
            throw new Error(`Unsupported action type: ${actionType}`);
        }
      } catch (error) {
        await this.updateBulkActionStats(actionId, 'failure');
        // Log the error
        console.error(`Error processing item: ${item.email}`, error);
      }
    }
  }

  async updateContact(data) {
    const { email, ...updateData } = data;
    return Contact.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, upsert: false }
    );
  }

  async updateBulkActionStats(actionId, type) {
    const update = {};
    switch (type) {
      case 'success':
        update.$inc = { successCount: 1, processedRecords: 1 };
        break;
      case 'failure':
        update.$inc = { failureCount: 1, processedRecords: 1 };
        break;
      case 'skipped':
        update.$inc = { skippedCount: 1, processedRecords: 1 };
        break;
    }

    await BulkAction.updateOne({ actionId }, update);
  }

  async handleBulkActionError(bulkAction, error) {
    await BulkAction.updateOne(
      { actionId: bulkAction.actionId },
      { 
        $set: { 
          status: 'failed',
          metadata: { ...bulkAction.metadata, error: error.message },
          updatedAt: new Date()
        }
      }
    );
  }

  async getBulkAction(actionId) {
    return BulkAction.findOne({ actionId });
  }

  async getBulkActionStats(actionId) {
    const bulkAction = await BulkAction.findOne({ actionId });
    if (!bulkAction) {
      throw new Error('Bulk action not found');
    }

    return {
      totalRecords: bulkAction.totalRecords,
      processedRecords: bulkAction.processedRecords,
      successCount: bulkAction.successCount,
      failureCount: bulkAction.failureCount,
      skippedCount: bulkAction.skippedCount,
      status: bulkAction.status
    };
  }

  async listBulkActions(accountId, filters = {}) {
    const query = { accountId };
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.entityType) {
      query.entityType = filters.entityType;
    }

    return BulkAction.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 10)
      .skip(filters.skip || 0);
  }
}

module.exports = new BulkActionService(); 