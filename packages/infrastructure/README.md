# Infrastructure Package

This package contains the AWS CDK infrastructure code for deploying the SoFi Application.

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

## Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Node.js 18 or later
- AWS CDK CLI installed globally (`npm install -g aws-cdk`)

## Deployment

1. Build the API and web application:
   ```bash
   npx nx build api
   npx nx build web
   ```

2. Deploy the infrastructure:
   ```bash
   npx nx run infrastructure:deploy
   ```

This will deploy the entire stack to AWS, including:
- DynamoDB tables
- S3 buckets
- Lambda functions
- API Gateway
- CloudFront distribution
- AWS Batch resources

## Environment Variables

The Lambda function requires the following environment variables:

- `DYNAMODB_EXPERIMENTS_TABLE`: Name of the experiments table
- `DYNAMODB_EVENTS_TABLE`: Name of the events table
- `DYNAMODB_REPORTS_TABLE`: Name of the reports table
- `S3_REPORTS_BUCKET`: Name of the reports bucket
- `BATCH_JOB_QUEUE`: ARN of the batch job queue
- `BATCH_JOB_DEFINITION`: ARN of the batch job definition
- `NODE_ENV`: Set to 'production' for production deployments

These are automatically set by the CDK stack during deployment.

## Outputs

After deployment, the following outputs are displayed:

- `ApiUrl`: URL of the API Gateway endpoint
- `WebUrl`: URL of the CloudFront distribution
- `ExperimentsTableArn`: ARN of the experiments table
- `EventsTableArn`: ARN of the events table
- `ReportsTableArn`: ARN of the reports table
- `ReportsBucketArn`: ARN of the reports bucket
- `WebBucketName`: Name of the web bucket
- `ReportGeneratorRepoUri`: URI of the ECR repository for the report generator
- `WebDistributionId`: ID of the CloudFront distribution

## Troubleshooting

If you encounter issues during deployment:

### API Issues

1. Check the CloudWatch logs for the Lambda function
2. Verify that the API Gateway is configured correctly
3. Ensure that the Lambda function has the correct permissions to access DynamoDB and S3
4. Check that the Lambda function is configured with the correct environment variables

### CloudFront Issues

If you encounter a 403 Forbidden error when accessing the CloudFront distribution:

1. **S3 Bucket Policy**: Ensure that the S3 bucket policy allows CloudFront to access the bucket. The policy should include a statement that allows the CloudFront Origin Access Identity to read from the bucket.

2. **CloudFront Distribution**: Check that the CloudFront distribution is correctly configured to use the Origin Access Identity to access the S3 bucket.

3. **CloudFront Cache**: It may take some time for CloudFront to propagate changes. Try invalidating the CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
   ```

4. **S3 Object Permissions**: Ensure that the objects in the S3 bucket have the correct permissions. They should be readable by the CloudFront Origin Access Identity.

5. **CloudFront Error Pages**: Check if the CloudFront distribution is configured to handle error pages correctly. The distribution should be configured to return the index.html file for 404 errors.

## Clean Up

To remove all resources created by the CDK stack:

```bash
npx nx run infrastructure:destroy
```

This will delete all resources created by the stack, including:
- DynamoDB tables
- S3 buckets
- Lambda functions
- API Gateway
- CloudFront distribution
- AWS Batch resources