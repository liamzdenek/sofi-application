import {
  createExperimentSchema,
  updateExperimentSchema,
  recordEventSchema,
  batchRecordEventsSchema,
  generateReportSchema,
  updateReportStatusSchema,
} from '../validation';

describe('Validation Schemas', () => {
  describe('createExperimentSchema', () => {
    it('should validate a valid experiment creation request', () => {
      const validRequest = {
        name: 'Test Experiment',
        description: 'This is a test experiment description',
        variants: [
          { name: 'Control', config: { buttonColor: 'blue' } },
          { name: 'Variant A', config: { buttonColor: 'green' } },
        ],
        targetUserPercentage: 50,
      };

      const { error } = createExperimentSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should validate a request with optional fields', () => {
      const validRequest = {
        name: 'Test Experiment',
        description: 'This is a test experiment description',
        variants: [
          { name: 'Control', config: { buttonColor: 'blue' } },
          { name: 'Variant A', config: { buttonColor: 'green' } },
        ],
        targetUserPercentage: 50,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      };

      const { error } = createExperimentSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should reject a request with missing required fields', () => {
      const invalidRequest = {
        name: 'Test Experiment',
        // Missing description
        variants: [
          { name: 'Control', config: { buttonColor: 'blue' } },
          { name: 'Variant A', config: { buttonColor: 'green' } },
        ],
        targetUserPercentage: 50,
      };

      const { error } = createExperimentSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });

    it('should reject a request with invalid field values', () => {
      const invalidRequest = {
        name: 'Te', // Too short
        description: 'Short', // Too short
        variants: [
          { name: 'Control', config: { buttonColor: 'blue' } },
          // Only one variant
        ],
        targetUserPercentage: 150, // Out of range
      };

      const { error } = createExperimentSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('updateExperimentSchema', () => {
    it('should validate a valid experiment update request', () => {
      const validRequest = {
        name: 'Updated Experiment',
        status: 'ACTIVE',
      };

      const { error } = updateExperimentSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should reject a request with invalid status', () => {
      const invalidRequest = {
        status: 'INVALID_STATUS',
      };

      const { error } = updateExperimentSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('recordEventSchema', () => {
    it('should validate a valid event record request', () => {
      const validRequest = {
        experimentId: 'exp123',
        variantId: 'var456',
        userId: 'user789',
        sessionId: 'session101112',
        action: 'BUTTON_CLICK',
        metadata: { buttonColor: 'blue' },
      };

      const { error } = recordEventSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should validate a request without optional metadata', () => {
      const validRequest = {
        experimentId: 'exp123',
        variantId: 'var456',
        userId: 'user789',
        sessionId: 'session101112',
        action: 'BUTTON_CLICK',
      };

      const { error } = recordEventSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should reject a request with missing required fields', () => {
      const invalidRequest = {
        experimentId: 'exp123',
        variantId: 'var456',
        // Missing userId
        sessionId: 'session101112',
        action: 'BUTTON_CLICK',
      };

      const { error } = recordEventSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('batchRecordEventsSchema', () => {
    it('should validate a valid batch event record request', () => {
      const validRequest = {
        events: [
          {
            experimentId: 'exp123',
            variantId: 'var456',
            userId: 'user789',
            sessionId: 'session101112',
            action: 'BUTTON_CLICK',
          },
          {
            experimentId: 'exp123',
            variantId: 'var456',
            userId: 'user789',
            sessionId: 'session101112',
            action: 'PAGE_VIEW',
            metadata: { page: 'home' },
          },
        ],
      };

      const { error } = batchRecordEventsSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should reject a request with empty events array', () => {
      const invalidRequest = {
        events: [],
      };

      const { error } = batchRecordEventsSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });

    it('should reject a request with invalid events', () => {
      const invalidRequest = {
        events: [
          {
            experimentId: 'exp123',
            // Missing variantId
            userId: 'user789',
            sessionId: 'session101112',
            action: 'BUTTON_CLICK',
          },
        ],
      };

      const { error } = batchRecordEventsSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('generateReportSchema', () => {
    it('should validate a valid report generation request', () => {
      const validRequest = {
        experimentId: 'exp123',
        timeRange: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-31T23:59:59Z',
        },
      };

      const { error } = generateReportSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should validate a request without optional timeRange', () => {
      const validRequest = {
        experimentId: 'exp123',
      };

      const { error } = generateReportSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should reject a request with missing experimentId', () => {
      const invalidRequest = {
        timeRange: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-31T23:59:59Z',
        },
      };

      const { error } = generateReportSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });

    it('should reject a request with invalid date format', () => {
      const invalidRequest = {
        experimentId: 'exp123',
        timeRange: {
          start: '2025/01/01', // Invalid ISO format
          end: '2025-01-31T23:59:59Z',
        },
      };

      const { error } = generateReportSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('updateReportStatusSchema', () => {
    it('should validate a valid report status update request', () => {
      const validRequest = {
        status: 'COMPLETED',
        metrics: {
          totalEvents: 100,
          variantCounts: {
            'var1': 50,
            'var2': 50,
          },
        },
      };

      const { error } = updateReportStatusSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should validate a request without optional metrics', () => {
      const validRequest = {
        status: 'PROCESSING',
      };

      const { error } = updateReportStatusSchema.validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should reject a request with invalid status', () => {
      const invalidRequest = {
        status: 'INVALID_STATUS',
      };

      const { error } = updateReportStatusSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });

    it('should reject a request with invalid metrics format', () => {
      const invalidRequest = {
        status: 'COMPLETED',
        metrics: {
          // Missing totalEvents
          variantCounts: {
            'var1': 50,
            'var2': 50,
          },
        },
      };

      const { error } = updateReportStatusSchema.validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });
});