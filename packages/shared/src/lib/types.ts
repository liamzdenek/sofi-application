// Core Data Models

export interface Variant {
  id: string;
  name: string;
  config: Record<string, any>; // Flexible configuration object
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  variants: Variant[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  startDate?: string; // Optional start date
  endDate?: string; // Optional end date
  targetUserPercentage: number; // 0-100, percentage of users to include
}

// Event Models
export interface ExperimentEvent {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  action: string; // e.g., 'PAGE_VIEW', 'BUTTON_CLICK', 'CONVERSION'
  metadata?: Record<string, any>; // Additional event data
  timestamp: string; // ISO date string
}

// Report Models
export interface ReportMetadata {
  id: string;
  experimentId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  s3Location: string; // S3 URI to the report JSON
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  metrics?: {
    totalEvents: number;
    variantCounts: Record<string, number>;
  };
}

export interface ReportData {
  experimentId: string;
  experimentName: string;
  generatedAt: string; // ISO date string
  timeRange: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  metrics: {
    overall: {
      totalUsers: number;
      totalEvents: number;
      conversionRate: number;
    };
    byVariant: {
      [variantId: string]: {
        users: number;
        events: Record<string, number>; // Action counts
        conversionRate: number;
        improvement?: number; // Percentage improvement over control
        significanceLevel?: number; // p-value if applicable
      };
    };
    timeSeries: {
      // Daily metrics
      dates: string[]; // Array of date strings
      byVariant: {
        [variantId: string]: {
          events: number[];
          conversions: number[];
        };
      };
    };
  };
}

// API Request/Response Types

// Experiment Management
export interface CreateExperimentRequest {
  name: string;
  description: string;
  variants: Omit<Variant, 'id'>[]; // Variant without ID (generated by API)
  targetUserPercentage: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateExperimentResponse {
  experiment: Experiment;
}

export interface GetExperimentRequest {
  id: string;
}

export interface GetExperimentResponse {
  experiment: Experiment;
}

export interface ListExperimentsRequest {
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  limit?: number;
  offset?: number;
}

export interface ListExperimentsResponse {
  experiments: Experiment[];
  total: number;
}

export interface UpdateExperimentRequest {
  id: string;
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  variants?: Variant[];
  targetUserPercentage?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateExperimentResponse {
  experiment: Experiment;
}

// Event Collection
export interface RecordEventRequest {
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface RecordEventResponse {
  success: boolean;
  eventId: string;
}

export interface BatchRecordEventsRequest {
  events: Omit<ExperimentEvent, 'id' | 'timestamp'>[];
}

export interface BatchRecordEventsResponse {
  success: boolean;
  eventIds: string[];
}

// Experiment Assignment (for Sample Page)
export interface GetActiveExperimentsRequest {
  userId: string;
  sessionId: string;
}

export interface GetActiveExperimentsResponse {
  experiments: Array<{
    experimentId: string;
    variantId: string;
    config: Record<string, any>;
  }>;
}

// Report Management
export interface GenerateReportRequest {
  experimentId: string;
  timeRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
}

export interface GenerateReportResponse {
  reportId: string;
  status: 'PENDING';
}

export interface GetReportRequest {
  id: string;
}

export interface GetReportResponse {
  report: ReportMetadata;
}

export interface ListReportsRequest {
  experimentId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  limit?: number;
  offset?: number;
}

export interface ListReportsResponse {
  reports: ReportMetadata[];
  total: number;
}

export interface GetReportDataRequest {
  id: string;
}

export interface GetReportDataResponse {
  reportData: ReportData;
}

// AWS Batch Job Parameters
export interface ReportJobParameters {
  experimentId: string;
  reportId: string;
  timeRange: {
    start: string;
    end: string;
  };
  outputBucket: string;
  outputKey: string;
}