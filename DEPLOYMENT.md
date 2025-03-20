# SoFi Application Deployment

This document outlines the deployment process for the SoFi Application using AWS CDK.

## Architecture

The application is deployed using AWS CDK with the following components:

- **DynamoDB Tables**:
  - `ExperimentsTable`: Stores experiment data
  - `EventsTable`: Stores experiment events
  - `ReportsTable`: Stores report metadata

- **S3 Buckets**:
  - `ReportsBucket`: Stores report files
  - `WebBucket`: Hosts the web application

- **Lambda Functions**:
  - `ApiFunction`: Handles all API requests using a single Lambda function with Express.js

- **API Gateway**:
  - REST API with proxy integration to the Lambda function
  - Handles all routes through a `/{proxy+}` pattern

- **CloudFront Distribution**:
  - Serves the web application from the S3 bucket

- **AWS Batch**:
  - Used for report generation

## Deployment Process

1. Build the API and web application:
   ```bash
   npx nx build api
   npx nx build web
   ```

2. Deploy the infrastructure:
   ```bash
   npx nx run infrastructure:deploy
   ```

## Environment Variables

The Lambda function requires the following environment variables:

- `DYNAMODB_EXPERIMENTS_TABLE`: Name of the experiments table
- `DYNAMODB_EVENTS_TABLE`: Name of the events table
- `DYNAMODB_REPORTS_TABLE`: Name of the reports table
- `S3_REPORTS_BUCKET`: Name of the reports bucket
- `BATCH_JOB_QUEUE`: ARN of the batch job queue
- `BATCH_JOB_DEFINITION`: ARN of the batch job definition
- `NODE_ENV`: Set to 'production' for production deployments

## API Endpoints

The API is accessible at: https://a9wkrb830e.execute-api.us-west-2.amazonaws.com/api/

The API uses a proxy integration with API Gateway, which means all requests are routed to the Lambda function. The Lambda function then uses Express.js to route the requests to the appropriate handlers.

## Web Application

The web application is accessible at: https://dy6twvdgk8blk.cloudfront.net

## Current Status

The infrastructure has been successfully deployed, but there are some issues:

1. The API returns "Internal server error" for requests to the root path (`/`).
2. The API is configured to handle requests to `/{proxy+}` with the ANY method.
3. The CloudFront distribution returns a 403 Forbidden error when accessing the web application, even though the files are present in the S3 bucket.

## Troubleshooting

### API Issues

If you encounter issues with the API, check the CloudWatch logs for the Lambda function. The logs may provide more information about the error.

### CloudFront Issues

If you encounter a 403 Forbidden error when accessing the CloudFront distribution, check the following:

1. **S3 Bucket Policy**: Ensure that the S3 bucket policy allows CloudFront to access the bucket. The policy should include a statement that allows the CloudFront Origin Access Identity to read from the bucket.

2. **CloudFront Distribution**: Check that the CloudFront distribution is correctly configured to use the Origin Access Identity to access the S3 bucket.

3. **CloudFront Cache**: It may take some time for CloudFront to propagate changes. Try invalidating the CloudFront cache by running:
   ```bash
   aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
   ```

4. **S3 Object Permissions**: Ensure that the objects in the S3 bucket have the correct permissions. They should be readable by the CloudFront Origin Access Identity.

5. **CloudFront Error Pages**: Check if the CloudFront distribution is configured to handle error pages correctly. The distribution should be configured to return the index.html file for 404 errors.

## Future Improvements

1. Add CloudWatch alarms for monitoring
2. Set up CI/CD pipeline for automated deployments
3. Implement proper error handling in the Lambda function
4. Add authentication and authorization