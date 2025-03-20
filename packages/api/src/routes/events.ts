import express from 'express';
import { recordEvent, batchRecordEvents } from '../lib/dynamodb';
import { logger, handleError } from '../lib/logger';
import { validateRequest } from '../lib/middleware';
import { recordEventSchema, batchRecordEventsSchema } from '../lib/validation';

const router = express.Router();

/**
 * @api {post} /events Record a single event
 * @apiName RecordEvent
 * @apiGroup Events
 * @apiDescription Record a single experiment event
 *
 * @apiParam {String} experimentId Experiment identifier
 * @apiParam {String} variantId Variant identifier
 * @apiParam {String} userId User identifier
 * @apiParam {String} sessionId Session identifier
 * @apiParam {String} action Event action (e.g., 'PAGE_VIEW', 'BUTTON_CLICK')
 * @apiParam {Object} [metadata] Optional additional event data
 *
 * @apiSuccess {Boolean} success Indicates if the event was recorded successfully
 * @apiSuccess {String} eventId The generated event ID
 *
 * @apiError (400) BadRequest Missing or invalid required fields
 * @apiError (500) ServerError Failed to record event
 */
router.post('/', validateRequest(recordEventSchema), async (req, res) => {
  try {
    const {
      experimentId,
      variantId,
      userId,
      sessionId,
      action,
      metadata,
    } = req.body;

    const eventId = await recordEvent(
      experimentId,
      variantId,
      userId,
      sessionId,
      action,
      metadata
    );

    res.status(201).json({
      success: true,
      eventId,
    });
  } catch (error) {
    logger.error('Error recording event', error as Error, { body: req.body });
    res.status(500).json({
      message: 'Failed to record event',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error recording event', error as Error), 0);
  }
});

/**
 * @api {post} /events/batch Batch record events
 * @apiName BatchRecordEvents
 * @apiGroup Events
 * @apiDescription Record multiple experiment events in a single request
 *
 * @apiParam {Array} events Array of event objects
 * @apiParam {String} events.experimentId Experiment identifier
 * @apiParam {String} events.variantId Variant identifier
 * @apiParam {String} events.userId User identifier
 * @apiParam {String} events.sessionId Session identifier
 * @apiParam {String} events.action Event action
 * @apiParam {Object} [events.metadata] Optional additional event data
 *
 * @apiSuccess {Boolean} success Indicates if the events were recorded successfully
 * @apiSuccess {Array} eventIds Array of generated event IDs
 *
 * @apiError (400) BadRequest Missing or invalid events array
 * @apiError (500) ServerError Failed to batch record events
 */
router.post('/batch', validateRequest(batchRecordEventsSchema), async (req, res) => {
  try {
    const { events } = req.body;
    const eventIds = await batchRecordEvents(events);

    res.status(201).json({
      success: true,
      eventIds,
    });
  } catch (error) {
    logger.error('Error batch recording events', error as Error, { body: req.body });
    res.status(500).json({
      message: 'Failed to batch record events',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error batch recording events', error as Error), 0);
  }
});

export default router;