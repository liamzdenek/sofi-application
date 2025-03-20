import express from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { BatchClient, SubmitJobCommand } from '@aws-sdk/client-batch';
import {
  createReportMetadata,
  getReportMetadata,
  listReports,
  updateReportStatus,
} from '../lib/dynamodb';
import { ReportJobParameters } from '@sofi-application/shared';
import { logger, handleError } from '../lib/logger';

const router = express.Router();

// Initialize AWS clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const batchClient = new BatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Environment variables
const BATCH_JOB_QUEUE = process.env.BATCH_JOB_QUEUE || '';
const BATCH_JOB_DEFINITION = process.env.BATCH_JOB_DEFINITION || '';
const S3_REPORTS_BUCKET = process.env.S3_REPORTS_BUCKET || '';

if (!BATCH_JOB_QUEUE || !BATCH_JOB_DEFINITION || !S3_REPORTS_BUCKET) {
  logger.error(
    'Missing required environment variables for AWS Batch and S3',
    new Error('Missing environment variables'),
    {
      BATCH_JOB_QUEUE: !!BATCH_JOB_QUEUE,
      BATCH_JOB_DEFINITION: !!BATCH_JOB_DEFINITION,
      S3_REPORTS_BUCKET: !!S3_REPORTS_BUCKET
    }
  );
}

// Generate a report
router.post('/', async (req, res) => {
  try {
    const { experimentId, timeRange } = req.body;

    if (!experimentId) {
      return res.status(400).json({
        message: 'Missing required field: experimentId',
      });
    }

    // Create report metadata
    const reportMetadata = await createReportMetadata(experimentId);

    // Prepare job parameters
    const jobParameters: ReportJobParameters = {
      experimentId,
      reportId: reportMetadata.id,
      timeRange: timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        end: new Date().toISOString(),
      },
      outputBucket: S3_REPORTS_BUCKET,
      outputKey: reportMetadata.s3Location,
    };

    // Submit AWS Batch job
    const submitJobCommand = new SubmitJobCommand({
      jobName: `report-generation-${reportMetadata.id}`,
      jobQueue: BATCH_JOB_QUEUE,
      jobDefinition: BATCH_JOB_DEFINITION,
      containerOverrides: {
        environment: [
          {
            name: 'JOB_PARAMETERS',
            value: JSON.stringify(jobParameters),
          },
        ],
      },
    });

    await batchClient.send(submitJobCommand);

    // Return the report ID and status
    res.status(201).json({
      reportId: reportMetadata.id,
      status: 'PENDING',
    });
  } catch (error) {
    logger.error('Error generating report', error as Error, { body: req.body });
    res.status(500).json({
      message: 'Failed to generate report',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error generating report', error as Error), 0);
  }
});

// Get report metadata
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getReportMetadata(id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
      });
    }

    res.json({
      report,
    });
  } catch (error) {
    logger.error('Error getting report', error as Error, { params: req.params });
    res.status(500).json({
      message: 'Failed to get report',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error getting report', error as Error), 0);
  }
});

// List reports
router.get('/', async (req, res) => {
  try {
    const { experimentId, status, limit, offset } = req.query;
    
    const result = await listReports(
      experimentId as string | undefined,
      status as string | undefined,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );

    res.json({
      reports: result.reports,
      total: result.total,
    });
  } catch (error) {
    logger.error('Error listing reports', error as Error, { query: req.query });
    res.status(500).json({
      message: 'Failed to list reports',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error listing reports', error as Error), 0);
  }
});

// Get report data
router.get('/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getReportMetadata(id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
      });
    }

    if (report.status !== 'COMPLETED') {
      return res.status(400).json({
        message: `Report is not ready. Current status: ${report.status}`,
      });
    }

    // Get the report data from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: S3_REPORTS_BUCKET,
      Key: report.s3Location,
    });

    const s3Response = await s3Client.send(getObjectCommand);
    
    if (!s3Response.Body) {
      return res.status(404).json({
        message: 'Report data not found in S3',
      });
    }

    // Convert the S3 response body to a string
    const reportDataString = await s3Response.Body.transformToString();
    const reportData = JSON.parse(reportDataString);

    res.json({
      reportData,
    });
  } catch (error) {
    logger.error('Error getting report data', error as Error, { params: req.params });
    res.status(500).json({
      message: 'Failed to get report data',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error getting report data', error as Error), 0);
  }
});

// Update report status (internal endpoint, not exposed in API contracts)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, metrics } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Missing required field: status',
      });
    }

    const updatedReport = await updateReportStatus(id, status, metrics);

    if (!updatedReport) {
      return res.status(404).json({
        message: 'Report not found',
      });
    }

    res.json({
      report: updatedReport,
    });
  } catch (error) {
    logger.error('Error updating report status', error as Error, {
      params: req.params,
      body: req.body
    });
    res.status(500).json({
      message: 'Failed to update report status',
      error: (error as Error).message,
    });
    setTimeout(() => handleError('Error updating report status', error as Error), 0);
  }
});

export default router;