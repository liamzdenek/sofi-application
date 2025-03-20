import Joi from 'joi';

// Experiment validation schemas
export const createExperimentSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10),
  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().required().min(1).max(50),
      config: Joi.object().required(),
    })
  ).min(2).required(),
  targetUserPercentage: Joi.number().integer().min(1).max(100).required(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
});

export const updateExperimentSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().min(10).optional(),
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED').optional(),
  variants: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required().min(1).max(50),
      config: Joi.object().required(),
    })
  ).min(2).optional(),
  targetUserPercentage: Joi.number().integer().min(1).max(100).optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
});

// Event validation schemas
export const recordEventSchema = Joi.object({
  experimentId: Joi.string().required(),
  variantId: Joi.string().required(),
  userId: Joi.string().required(),
  sessionId: Joi.string().required(),
  action: Joi.string().required(),
  metadata: Joi.object().optional(),
});

export const batchRecordEventsSchema = Joi.object({
  events: Joi.array().items(
    Joi.object({
      experimentId: Joi.string().required(),
      variantId: Joi.string().required(),
      userId: Joi.string().required(),
      sessionId: Joi.string().required(),
      action: Joi.string().required(),
      metadata: Joi.object().optional(),
    })
  ).min(1).required(),
});

// Report validation schemas
export const generateReportSchema = Joi.object({
  experimentId: Joi.string().required(),
  timeRange: Joi.object({
    start: Joi.string().isoDate().required(),
    end: Joi.string().isoDate().required(),
  }).optional(),
}).options({ abortEarly: false });

export const updateReportStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED').required(),
  metrics: Joi.object({
    totalEvents: Joi.number().integer().required(),
    variantCounts: Joi.object().pattern(
      Joi.string(),
      Joi.number().integer()
    ).required(),
  }).optional(),
});