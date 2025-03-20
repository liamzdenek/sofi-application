import express from 'express';
import {
  createExperiment,
  getExperiment,
  listExperiments,
  updateExperiment,
  getActiveExperimentsForUser,
} from '../lib/dynamodb';
import { logger, handleError } from '../lib/logger';

const router = express.Router();

// Create experiment
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      variants,
      targetUserPercentage,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
    if (!name || !description || !variants || !targetUserPercentage) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    const experiment = await createExperiment(
      name,
      description,
      variants,
      targetUserPercentage,
      startDate,
      endDate
    );

    res.status(201).json({
      experiment,
    });
  } catch (error) {
    logger.error('Error creating experiment', error as Error, { body: req.body });
    res.status(500).json({
      message: 'Failed to create experiment',
      error: (error as Error).message,
    });
    // Re-throw the error after responding to the client
    setTimeout(() => handleError('Error creating experiment', error as Error), 0);
  }
});

// List experiments
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    const result = await listExperiments(
      status as string | undefined,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );

    res.json({
      experiments: result.experiments,
      total: result.total,
    });
  } catch (error) {
    logger.error('Error listing experiments', error as Error, { query: req.query });
    res.status(500).json({
      message: 'Failed to list experiments',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error listing experiments', error as Error), 0);
  }
});

// Get active experiments for user
// This route must be defined before the /:id route
router.get('/active', async (req, res) => {
  try {
    const { userId, sessionId } = req.query;

    if (!userId || !sessionId) {
      return res.status(400).json({
        message: 'Missing required query parameters: userId and sessionId',
      });
    }

    const activeExperiments = await getActiveExperimentsForUser(
      userId as string,
      sessionId as string
    );

    res.json({
      experiments: activeExperiments,
    });
  } catch (error) {
    logger.error('Error getting active experiments', error as Error, { query: req.query });
    res.status(500).json({
      message: 'Failed to get active experiments',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error getting active experiments', error as Error), 0);
  }
});

// Get experiment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const experiment = await getExperiment(id);

    if (!experiment) {
      return res.status(404).json({
        message: 'Experiment not found',
      });
    }

    res.json({
      experiment,
    });
  } catch (error) {
    logger.error('Error getting experiment', error as Error, { params: req.params });
    res.status(500).json({
      message: 'Failed to get experiment',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error getting experiment', error as Error), 0);
  }
});

// Update experiment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      variants,
      targetUserPercentage,
      startDate,
      endDate,
    } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (variants !== undefined) updates.variants = variants;
    if (targetUserPercentage !== undefined)
      updates.targetUserPercentage = targetUserPercentage;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    const updatedExperiment = await updateExperiment(id, updates);

    if (!updatedExperiment) {
      return res.status(404).json({
        message: 'Experiment not found',
      });
    }

    res.json({
      experiment: updatedExperiment,
    });
  } catch (error) {
    logger.error('Error updating experiment', error as Error, {
      params: req.params,
      body: req.body
    });
    res.status(500).json({
      message: 'Failed to update experiment',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error updating experiment', error as Error), 0);
  }
});

export default router;