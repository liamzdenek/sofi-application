import {
  CreateExperimentRequest,
  CreateExperimentResponse,
  GetExperimentRequest,
  GetExperimentResponse,
  ListExperimentsRequest,
  ListExperimentsResponse,
  UpdateExperimentRequest,
  UpdateExperimentResponse,
  RecordEventRequest,
  RecordEventResponse,
  BatchRecordEventsRequest,
  BatchRecordEventsResponse,
  GetActiveExperimentsRequest,
  GetActiveExperimentsResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  GetReportRequest,
  GetReportResponse,
  ListReportsRequest,
  ListReportsResponse,
  GetReportDataRequest,
  GetReportDataResponse,
} from './types';

/**
 * Client interface for the Experimentation API
 * This interface is used by both the frontend and backend implementations
 */
export interface ExperimentApiClientInterface {
  // Experiment Management API
  createExperiment(request: CreateExperimentRequest): Promise<CreateExperimentResponse>;
  getExperiment(request: GetExperimentRequest): Promise<GetExperimentResponse>;
  listExperiments(request?: ListExperimentsRequest): Promise<ListExperimentsResponse>;
  updateExperiment(request: UpdateExperimentRequest): Promise<UpdateExperimentResponse>;

  // Event Collection API
  recordEvent(request: RecordEventRequest): Promise<RecordEventResponse>;
  batchRecordEvents(request: BatchRecordEventsRequest): Promise<BatchRecordEventsResponse>;

  // Experiment Assignment API
  getActiveExperiments(request: GetActiveExperimentsRequest): Promise<GetActiveExperimentsResponse>;

  // Report Management API
  generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse>;
  getReport(request: GetReportRequest): Promise<GetReportResponse>;
  listReports(request?: ListReportsRequest): Promise<ListReportsResponse>;
  getReportData(request: GetReportDataRequest): Promise<GetReportDataResponse>;
}

/**
 * Frontend implementation of the Experimentation API client
 * This class is used by the web application to communicate with the API
 */
export class ExperimentApiClient implements ExperimentApiClientInterface {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Helper method for making API requests
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${
          errorData.message || 'Unknown error'
        }`
      );
    }

    return response.json();
  }

  // Experiment Management API
  async createExperiment(
    request: CreateExperimentRequest
  ): Promise<CreateExperimentResponse> {
    return this.request<CreateExperimentResponse>(
      '/experiments',
      'POST',
      request
    );
  }

  async getExperiment(
    request: GetExperimentRequest
  ): Promise<GetExperimentResponse> {
    return this.request<GetExperimentResponse>(
      `/experiments/${request.id}`,
      'GET'
    );
  }

  async listExperiments(
    request: ListExperimentsRequest = {}
  ): Promise<ListExperimentsResponse> {
    const queryParams = new URLSearchParams();
    if (request.status) queryParams.append('status', request.status);
    if (request.limit) queryParams.append('limit', request.limit.toString());
    if (request.offset) queryParams.append('offset', request.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/experiments?${queryString}`
      : '/experiments';

    return this.request<ListExperimentsResponse>(endpoint, 'GET');
  }

  async updateExperiment(
    request: UpdateExperimentRequest
  ): Promise<UpdateExperimentResponse> {
    return this.request<UpdateExperimentResponse>(
      `/experiments/${request.id}`,
      'PUT',
      request
    );
  }

  // Event Collection API
  async recordEvent(
    request: RecordEventRequest
  ): Promise<RecordEventResponse> {
    return this.request<RecordEventResponse>('/events', 'POST', request);
  }

  async batchRecordEvents(
    request: BatchRecordEventsRequest
  ): Promise<BatchRecordEventsResponse> {
    return this.request<BatchRecordEventsResponse>(
      '/events/batch',
      'POST',
      request
    );
  }

  // Experiment Assignment API
  async getActiveExperiments(
    request: GetActiveExperimentsRequest
  ): Promise<GetActiveExperimentsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', request.userId);
    queryParams.append('sessionId', request.sessionId);

    return this.request<GetActiveExperimentsResponse>(
      `/experiments/active?${queryParams.toString()}`,
      'GET'
    );
  }

  // Report Management API
  async generateReport(
    request: GenerateReportRequest
  ): Promise<GenerateReportResponse> {
    return this.request<GenerateReportResponse>('/reports', 'POST', request);
  }

  async getReport(request: GetReportRequest): Promise<GetReportResponse> {
    return this.request<GetReportResponse>(`/reports/${request.id}`, 'GET');
  }

  async listReports(
    request: ListReportsRequest = {}
  ): Promise<ListReportsResponse> {
    const queryParams = new URLSearchParams();
    if (request.experimentId)
      queryParams.append('experimentId', request.experimentId);
    if (request.status) queryParams.append('status', request.status);
    if (request.limit) queryParams.append('limit', request.limit.toString());
    if (request.offset) queryParams.append('offset', request.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/reports?${queryString}` : '/reports';

    return this.request<ListReportsResponse>(endpoint, 'GET');
  }

  async getReportData(
    request: GetReportDataRequest
  ): Promise<GetReportDataResponse> {
    return this.request<GetReportDataResponse>(
      `/reports/${request.id}/data`,
      'GET'
    );
  }
}