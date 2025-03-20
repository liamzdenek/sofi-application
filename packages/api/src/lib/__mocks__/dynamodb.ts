import { v4 as uuidv4 } from 'uuid';
import { Experiment, ExperimentEvent, ReportMetadata } from '@sofi-application/shared';
import { jest } from '@jest/globals';

// Mock data
const mockExperiments: Record<string, Experiment> = {};
const mockEvents: ExperimentEvent[] = [];
const mockReports: Record<string, ReportMetadata> = {};

// Mock implementations
export const createExperiment = jest.fn(
  (
    name: string,
    description: string,
    variants: any[],
    targetUserPercentage: number,
    startDate?: string,
    endDate?: string
  ): Promise<Experiment> => {
    const now = new Date().toISOString();
    const experimentId = uuidv4();

    // Generate IDs for variants
    const variantsWithIds = variants.map((variant) => ({
      ...variant,
      id: uuidv4(),
    }));

    const experiment: Experiment = {
      id: experimentId,
      name,
      description,
      status: 'DRAFT',
      variants: variantsWithIds,
      targetUserPercentage,
      createdAt: now,
      updatedAt: now,
      startDate,
      endDate,
    };

    mockExperiments[experimentId] = experiment;

    return Promise.resolve(experiment);
  }
);

export const getExperiment = jest.fn(
  (id: string): Promise<Experiment | null> => {
    const experiment = mockExperiments[id] || null;
    return Promise.resolve(experiment);
  }
);

export const listExperiments = jest.fn(
  (
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ experiments: Experiment[]; total: number }> => {
    let experiments = Object.values(mockExperiments);

    if (status) {
      experiments = experiments.filter((exp) => exp.status === status);
    }

    const total = experiments.length;
    const paginatedExperiments = experiments.slice(offset, offset + limit);

    return Promise.resolve({
      experiments: paginatedExperiments,
      total,
    });
  }
);

export const updateExperiment = jest.fn(
  (id: string, updates: Partial<Experiment>): Promise<Experiment | null> => {
    const experiment = mockExperiments[id];

    if (!experiment) {
      return Promise.resolve(null);
    }

    const updatedExperiment: Experiment = {
      ...experiment,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockExperiments[id] = updatedExperiment;

    return Promise.resolve(updatedExperiment);
  }
);

export const recordEvent = jest.fn(
  (
    experimentId: string,
    variantId: string,
    userId: string,
    sessionId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const eventId = uuidv4();

    const event: ExperimentEvent = {
      id: eventId,
      experimentId,
      variantId,
      userId,
      sessionId,
      action,
      metadata,
      timestamp: now,
    };

    mockEvents.push(event);

    return Promise.resolve(eventId);
  }
);

export const batchRecordEvents = jest.fn(
  (events: Omit<ExperimentEvent, 'id' | 'timestamp'>[]): Promise<string[]> => {
    const now = new Date().toISOString();
    const eventIds: string[] = [];

    for (const eventData of events) {
      const eventId = uuidv4();
      eventIds.push(eventId);

      const event: ExperimentEvent = {
        id: eventId,
        ...eventData,
        timestamp: now,
      };

      mockEvents.push(event);
    }

    return Promise.resolve(eventIds);
  }
);

export const getActiveExperimentsForUser = jest.fn(
  (
    userId: string,
    sessionId: string
  ): Promise<
    Array<{
      experimentId: string;
      variantId: string;
      config: Record<string, any>;
    }>
  > => {
    const activeExperiments = Object.values(mockExperiments).filter(
      (exp) => exp.status === 'ACTIVE'
    );

    const result = activeExperiments.map((exp) => {
      // Simple deterministic variant assignment based on userId and experimentId
      const variantIndex = (userId.charCodeAt(0) + exp.id.charCodeAt(0)) % exp.variants.length;
      const variant = exp.variants[variantIndex];

      return {
        experimentId: exp.id,
        variantId: variant.id,
        config: variant.config,
      };
    });

    return Promise.resolve(result);
  }
);

export const createReportMetadata = jest.fn(
  (experimentId: string): Promise<ReportMetadata> => {
    const now = new Date().toISOString();
    const reportId = uuidv4();

    const reportMetadata: ReportMetadata = {
      id: reportId,
      experimentId,
      status: 'PENDING',
      s3Location: `reports/${experimentId}/${reportId}.json`,
      createdAt: now,
      updatedAt: now,
    };

    mockReports[reportId] = reportMetadata;

    return Promise.resolve(reportMetadata);
  }
);

export const getReportMetadata = jest.fn(
  (id: string): Promise<ReportMetadata | null> => {
    const report = mockReports[id] || null;
    return Promise.resolve(report);
  }
);

export const listReports = jest.fn(
  (
    experimentId?: string,
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ reports: ReportMetadata[]; total: number }> => {
    let reports = Object.values(mockReports);

    if (experimentId) {
      reports = reports.filter((report) => report.experimentId === experimentId);
    }

    if (status) {
      reports = reports.filter((report) => report.status === status);
    }

    const total = reports.length;
    const paginatedReports = reports.slice(offset, offset + limit);

    return Promise.resolve({
      reports: paginatedReports,
      total,
    });
  }
);

export const updateReportStatus = jest.fn(
  (
    id: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    metrics?: {
      totalEvents: number;
      variantCounts: Record<string, number>;
    }
  ): Promise<ReportMetadata | null> => {
    const report = mockReports[id];

    if (!report) {
      return Promise.resolve(null);
    }

    const updatedReport: ReportMetadata = {
      ...report,
      status,
      metrics,
      updatedAt: new Date().toISOString(),
    };

    mockReports[id] = updatedReport;

    return Promise.resolve(updatedReport);
  }
);

// Helper function to reset all mocks and data
export const resetMocks = () => {
  // Clear mock data
  Object.keys(mockExperiments).forEach((key) => delete mockExperiments[key]);
  mockEvents.length = 0;
  Object.keys(mockReports).forEach((key) => delete mockReports[key]);

  // Reset mock functions
  createExperiment.mockClear();
  getExperiment.mockClear();
  listExperiments.mockClear();
  updateExperiment.mockClear();
  recordEvent.mockClear();
  batchRecordEvents.mockClear();
  getActiveExperimentsForUser.mockClear();
  createReportMetadata.mockClear();
  getReportMetadata.mockClear();
  listReports.mockClear();
  updateReportStatus.mockClear();
};