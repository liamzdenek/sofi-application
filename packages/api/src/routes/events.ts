import express from 'express';
import { recordEvent, batchRecordEvents } from '../lib/dynamodb';

const router = express.Router();

// Record a single event
router.post('/', async (req, res) => {
  try {
    const {
      experimentId,
      variantId,
      userId,
      sessionId,
      action,
      metadata,
    } = req.body;

    // Validate required fields
    if (!experimentId || !variantId || !userId || !sessionId || !action) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

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
    console.error('Error recording event:', error);
    res.status(500).json({
      message: 'Failed to record event',
      error: (error as Error).message,
    });
  }
});

// Batch record events
router.post('/batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        message: 'Missing or invalid events array',
      });
    }

    // Validate each event
    for (const event of events) {
      const { experimentId, variantId, userId, sessionId, action } = event;
      if (!experimentId || !variantId || !userId || !sessionId || !action) {
        return res.status(400).json({
          message: 'Missing required fields in one or more events',
        });
      }
    }

    const eventIds = await batchRecordEvents(events);

    res.status(201).json({
      success: true,
      eventIds,
    });
  } catch (error) {
    console.error('Error batch recording events:', error);
    res.status(500).json({
      message: 'Failed to batch record events',
      error: (error as Error).message,
    });
  }
});

export default router;