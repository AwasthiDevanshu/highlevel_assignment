const bulkActionService = require('../services/bulkActionService');
const { parseCSV } = require('../utils/csvParser');
const Joi = require('joi');

const createBulkActionSchema = Joi.object({
  accountId: Joi.string().required(),
  entityType: Joi.string().valid('contact', 'company', 'lead', 'opportunity', 'task').required(),
  actionType: Joi.string().valid('update', 'delete', 'create').required(),
  data: Joi.array().items(Joi.object()).required(),
  scheduledFor: Joi.date().iso().allow(null)
});

class BulkActionController {
  async createBulkAction(req, res) {
    try {
      const { error, value } = createBulkActionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { accountId, entityType, actionType, data, scheduledFor } = value;
      const bulkAction = await bulkActionService.createBulkAction(
        accountId,
        entityType,
        actionType,
        data,
        scheduledFor
      );

      res.status(201).json(bulkAction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createBulkActionFromCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      const { accountId, entityType, actionType, scheduledFor } = req.body;
      
      // Validate required fields
      if (!accountId || !entityType || !actionType) {
        return res.status(400).json({ 
          error: 'Missing required fields: accountId, entityType, actionType' 
        });
      }

      // Parse CSV file
      const data = await parseCSV(req.file.buffer);
      
      // Validate data format
      if (!data.length) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      // Check required fields in CSV
      const requiredFields = ['email', 'name', 'age', 'status'];
      const missingFields = requiredFields.filter(field => 
        !data[0].hasOwnProperty(field)
      );

      if (missingFields.length) {
        return res.status(400).json({ 
          error: `Missing required fields in CSV: ${missingFields.join(', ')}` 
        });
      }

      const bulkAction = await bulkActionService.createBulkAction(
        accountId,
        entityType,
        actionType,
        data,
        scheduledFor ? new Date(scheduledFor) : null
      );

      res.status(201).json(bulkAction);
    } catch (error) {
      console.error('Error processing CSV:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getBulkAction(req, res) {
    try {
      const { actionId } = req.params;
      const bulkAction = await bulkActionService.getBulkAction(actionId);

      if (!bulkAction) {
        return res.status(404).json({ error: 'Bulk action not found' });
      }

      res.json(bulkAction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBulkActionStats(req, res) {
    try {
      const { actionId } = req.params;
      const stats = await bulkActionService.getBulkActionStats(actionId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async listBulkActions(req, res) {
    try {
      const { accountId } = req.query;
      const filters = {
        status: req.query.status,
        entityType: req.query.entityType,
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip)
      };

      const bulkActions = await bulkActionService.listBulkActions(accountId, filters);
      res.json(bulkActions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BulkActionController(); 