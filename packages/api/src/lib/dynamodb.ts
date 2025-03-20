import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  Experiment,
  ExperimentEvent,
  ReportMetadata,
  Variant,
} from '@sofi-application/shared';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names from environment variables
const EXPERIMENTS_TABLE = process.env.DYNAMODB_EXPERIMENTS_TABLE || '';
const EVENTS_TABLE = process.env.DYNAMODB_EVENTS_TABLE || '';
const REPORTS_TABLE = process.env.DYNAMODB_REPORTS_TABLE || '';

if (!EXPERIMENTS_TABLE || !EVENTS_TABLE || !REPORTS_TABLE) {
  console.error(
    'Missing required environment variables for DynamoDB table names'
  );
}

// Experiment operations
export async function createExperiment(
  name: string,
  description: string,
  variants: Omit<Variant, 'id'>[],
  targetUserPercentage: number,
  startDate?: string,
  endDate?: string
): Promise<Experiment> {
  const now = new Date().toISOString();
  const experimentId = uuidv4();

  // Generate IDs for variants
  const variantsWithIds: Variant[] = variants.map((variant) => ({
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

  await docClient.send(
    new PutCommand({
      TableName: EXPERIMENTS_TABLE,
      Item: {
        version: 1, // Initial version
        ...experiment,
      },
    })
  );

  return experiment;
}

export async function getExperiment(id: string): Promise<Experiment | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: EXPERIMENTS_TABLE,
      Key: {
        id: id,
      }
    })
  );

  if (!response.Item) {
    return null;
  }

  // Extract the experiment data from the DynamoDB item
  const { version, ...experimentData } = response.Item;
  return experimentData as Experiment;
}

export async function listExperiments(
  status?: string,
  limit = 20,
  offset = 0
): Promise<{ experiments: Experiment[]; total: number }> {
  const scanParams: any = {
    TableName: EXPERIMENTS_TABLE,
    Limit: limit,
  };

  if (status) {
    scanParams.FilterExpression = '#statusAttr = :status';
    scanParams.ExpressionAttributeValues = {
      ':status': status,
    };
    scanParams.ExpressionAttributeNames = {
      '#statusAttr': 'status'
    };
  }

  // For pagination, we need to scan the table and apply the offset manually
  const response = await docClient.send(new ScanCommand(scanParams));

  const experiments: Experiment[] = [];
  if (response.Items) {
    // Group by experimentId and take the latest version
    const experimentMap = new Map<string, any>();
    for (const item of response.Items) {
      const { experimentId, version, ...experimentData } = item;
      if (
        !experimentMap.has(experimentId) ||
        experimentMap.get(experimentId).version < version
      ) {
        experimentMap.set(experimentId, { version, ...experimentData });
      }
    }

    // Convert map to array and apply offset and limit
    const allExperiments = Array.from(experimentMap.values());
    const paginatedExperiments = allExperiments.slice(
      offset,
      offset + limit
    );

    // Map to Experiment type
    experiments.push(...(paginatedExperiments as Experiment[]));
  }

  return {
    experiments,
    total: response.Count || 0,
  };
}

export async function updateExperiment(
  id: string,
  updates: Partial<Experiment>
): Promise<Experiment | null> {
  // First, get the current experiment
  const currentExperiment = await getExperiment(id);
  if (!currentExperiment) {
    return null;
  }

  // Create a new version with updates
  const now = new Date().toISOString();
  const updatedExperiment: Experiment = {
    ...currentExperiment,
    ...updates,
    updatedAt: now,
  };

  // Get the current version from DynamoDB
  const response = await docClient.send(
    new GetCommand({
      TableName: EXPERIMENTS_TABLE,
      Key: {
        id: id,
      }
    })
  );

  if (!response.Item) {
    return null;
  }

  const currentVersion = response.Item.version || 0;
  const newVersion = currentVersion + 1;

  // Save the updated experiment with a new version
  await docClient.send(
    new PutCommand({
      TableName: EXPERIMENTS_TABLE,
      Item: {
        version: newVersion,
        ...updatedExperiment,
      },
    })
  );

  return updatedExperiment;
}

// Event operations
export async function recordEvent(
  experimentId: string,
  variantId: string,
  userId: string,
  sessionId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<string> {
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

  await docClient.send(
    new PutCommand({
      TableName: EVENTS_TABLE,
      Item: event,
    })
  );

  return eventId;
}

export async function batchRecordEvents(
  events: Omit<ExperimentEvent, 'id' | 'timestamp'>[]
): Promise<string[]> {
  const now = new Date().toISOString();
  const eventIds: string[] = [];

  // Process events in batches of 25 (DynamoDB batch write limit)
  const batchSize = 25;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const batchPromises = batch.map(async (eventData) => {
      const eventId = uuidv4();
      eventIds.push(eventId);

      const event: ExperimentEvent = {
        id: eventId,
        ...eventData,
        timestamp: now,
      };

      return docClient.send(
        new PutCommand({
          TableName: EVENTS_TABLE,
          Item: event,
        })
      );
    });

    await Promise.all(batchPromises);
  }

  return eventIds;
}

// Get active experiments for a user
export async function getActiveExperimentsForUser(
  userId: string,
  sessionId: string
): Promise<
  Array<{
    experimentId: string;
    variantId: string;
    config: Record<string, any>;
  }>
> {
  // Get all active experiments
  const { experiments } = await listExperiments('ACTIVE');

  // Determine which experiments the user should be part of
  // This is a simplified implementation - in a real system, you would use a more sophisticated
  // algorithm for experiment assignment and ensure consistent assignment
  const activeExperiments = [];

  for (const experiment of experiments) {
    // Check if user should be included based on targetUserPercentage
    // Using a hash of userId + sessionId + experimentId for variant assignment
    // This ensures different sessions get different variants
    const hash = hashString(`${userId}-${sessionId}-${experiment.id}`);
    const normalizedHash = hash % 100; // 0-99

    if (normalizedHash < experiment.targetUserPercentage) {
      // Assign a variant - use the hash to pick a variant
      const variantIndex = hash % experiment.variants.length;
      const variant = experiment.variants[variantIndex];

      activeExperiments.push({
        experimentId: experiment.id,
        variantId: variant.id,
        config: variant.config,
      });
    }
  }

  return activeExperiments;
}

// Report operations
export async function createReportMetadata(
  experimentId: string
): Promise<ReportMetadata> {
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

  await docClient.send(
    new PutCommand({
      TableName: REPORTS_TABLE,
      Item: reportMetadata,
    })
  );

  return reportMetadata;
}

export async function getReportMetadata(
  id: string
): Promise<ReportMetadata | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: REPORTS_TABLE,
      Key: {
        id,
      },
    })
  );

  if (!response.Item) {
    return null;
  }

  return response.Item as ReportMetadata;
}

export async function listReports(
  experimentId?: string,
  status?: string,
  limit = 20,
  offset = 0
): Promise<{ reports: ReportMetadata[]; total: number }> {
  // If experimentId is provided, use the GSI to query by experimentId
  if (experimentId) {
    const queryParams: any = {
      TableName: REPORTS_TABLE,
      IndexName: 'experimentId-index',
      KeyConditionExpression: 'experimentId = :experimentId',
      ExpressionAttributeValues: {
        ':experimentId': experimentId,
      },
      Limit: limit,
    };

    // Add status filter if provided
    if (status) {
      queryParams.FilterExpression = '#statusAttr = :status';
      queryParams.ExpressionAttributeValues[':status'] = status;
      queryParams.ExpressionAttributeNames = {
        '#statusAttr': 'status',
      };
    }

    const response = await docClient.send(new QueryCommand(queryParams));

    const reports: ReportMetadata[] = [];
    if (response.Items) {
      // Apply offset manually
      const paginatedReports = response.Items.slice(offset, offset + limit);
      reports.push(...(paginatedReports as ReportMetadata[]));
    }

    return {
      reports,
      total: response.Count || 0,
    };
  } else {
    // If no experimentId is provided, use scan operation
    const scanParams: any = {
      TableName: REPORTS_TABLE,
      Limit: limit,
    };

    // Add status filter if provided
    if (status) {
      scanParams.FilterExpression = '#statusAttr = :status';
      scanParams.ExpressionAttributeValues = {
        ':status': status,
      };
      scanParams.ExpressionAttributeNames = {
        '#statusAttr': 'status',
      };
    }

    const response = await docClient.send(new ScanCommand(scanParams));

    const reports: ReportMetadata[] = [];
    if (response.Items) {
      // Apply offset manually
      const paginatedReports = response.Items.slice(offset, offset + limit);
      reports.push(...(paginatedReports as ReportMetadata[]));
    }

    return {
      reports,
      total: response.Count || 0,
    };
  }
}

export async function updateReportStatus(
  id: string,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  metrics?: {
    totalEvents: number;
    variantCounts: Record<string, number>;
  }
): Promise<ReportMetadata | null> {
  const now = new Date().toISOString();

  const updateParams: any = {
    TableName: REPORTS_TABLE,
    Key: {
      id,
    },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':updatedAt': now,
    },
    ReturnValues: 'ALL_NEW',
  };

  if (metrics) {
    updateParams.UpdateExpression += ', metrics = :metrics';
    updateParams.ExpressionAttributeValues[':metrics'] = metrics;
  }

  const response = await docClient.send(new UpdateCommand(updateParams));

  if (!response.Attributes) {
    return null;
  }

  return response.Attributes as ReportMetadata;
}

// Helper function to create a simple hash
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}