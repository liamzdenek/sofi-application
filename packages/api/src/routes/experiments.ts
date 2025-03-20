import express from 'express';
import {
  createExperiment,
  getExperiment,
  listExperiments,
  updateExperiment,
  getActiveExperimentsForUser,
} from '../lib/dynamodb';
import { logger, handleError } from '../lib/logger';
import { validateRequest } from '../lib/middleware';
import { createExperimentSchema, updateExperimentSchema } from '../lib/validation';

const router = express.Router();

/**
 * @api {post} /experiments Create a new experiment
 * @apiName CreateExperiment
 * @apiGroup Experiments
 * @apiDescription Creates a new experiment with the provided details
 *
 * @apiParam {String} name Name of the experiment
 * @apiParam {String} description Description of the experiment
 * @apiParam {Array} variants Array of variant objects (without IDs)
 * @apiParam {Number} targetUserPercentage Percentage of users to include (1-100)
 * @apiParam {String} [startDate] Optional ISO date string for experiment start
 * @apiParam {String} [endDate] Optional ISO date string for experiment end
 *
 * @apiSuccess {Object} experiment The created experiment object
 *
 * @apiError (400) BadRequest Missing or invalid required fields
 * @apiError (500) ServerError Failed to create experiment
 */
router.post('/', validateRequest(createExperimentSchema), async (req, res) => {
  try {
    const {
      name,
      description,
      variants,
      targetUserPercentage,
      startDate,
      endDate,
    } = req.body;

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

/**
 * @api {get} /experiments List experiments
 * @apiName ListExperiments
 * @apiGroup Experiments
 * @apiDescription Get a list of experiments with optional filtering
 *
 * @apiParam {String} [status] Filter by experiment status
 * @apiParam {Number} [limit] Maximum number of experiments to return
 * @apiParam {Number} [offset] Number of experiments to skip
 *
 * @apiSuccess {Array} experiments List of experiment objects
 * @apiSuccess {Number} total Total number of experiments matching the criteria
 *
 * @apiError (500) ServerError Failed to list experiments
 */
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

/**
 * @api {get} /experiments/active Get active experiments for user
 * @apiName GetActiveExperiments
 * @apiGroup Experiments
 * @apiDescription Get active experiments assigned to a specific user
 *
 * @apiParam {String} userId User identifier
 * @apiParam {String} sessionId Session identifier
 *
 * @apiSuccess {Array} experiments List of active experiments with variant assignments
 *
 * @apiError (400) BadRequest Missing required query parameters
 * @apiError (500) ServerError Failed to get active experiments
 */
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

/**
 * @api {get} /experiments/:id Get experiment by ID
 * @apiName GetExperiment
 * @apiGroup Experiments
 * @apiDescription Get detailed information about a specific experiment
 *
 * @apiParam {String} id Experiment identifier
 *
 * @apiSuccess {Object} experiment The experiment object
 *
 * @apiError (404) NotFound Experiment not found
 * @apiError (500) ServerError Failed to get experiment
 */
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

/**
 * @api {put} /experiments/:id Update experiment
 * @apiName UpdateExperiment
 * @apiGroup Experiments
 * @apiDescription Update an existing experiment
 *
 * @apiParam {String} id Experiment identifier
 * @apiParam {String} [name] Updated name
 * @apiParam {String} [description] Updated description
 * @apiParam {String} [status] Updated status (DRAFT, ACTIVE, PAUSED, COMPLETED)
 * @apiParam {Array} [variants] Updated variants array
 * @apiParam {Number} [targetUserPercentage] Updated target user percentage
 * @apiParam {String} [startDate] Updated start date
 * @apiParam {String} [endDate] Updated end date
 *
 * @apiSuccess {Object} experiment The updated experiment object
 *
 * @apiError (400) BadRequest Invalid update parameters
 * @apiError (404) NotFound Experiment not found
 * @apiError (500) ServerError Failed to update experiment
 */
router.put('/:id', validateRequest(updateExperimentSchema), async (req, res) => {
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