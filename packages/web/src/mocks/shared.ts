// Mock implementation of shared types for development

export interface Variant {
  id: string;
  name: string;
  config: Record<string, any>;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  targetUserPercentage: number;
}

export interface ExperimentEvent {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ReportMetadata {
  id: string;
  experimentId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  s3Location: string;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    totalEvents: number;
    variantCounts: Record<string, number>;
  };
}

export interface ReportData {
  experimentId: string;
  experimentName: string;
  generatedAt: string;
  timeRange: {
    start: string;
    end: string;
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
        events: Record<string, number>;
        conversionRate: number;
        improvement?: number;
        significanceLevel?: number;
      };
    };
    timeSeries: {
      dates: string[];
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
export interface CreateExperimentRequest {
  name: string;
  description: string;
  variants: Omit<Variant, 'id'>[];
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

