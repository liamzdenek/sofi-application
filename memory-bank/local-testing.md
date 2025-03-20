# Local Testing Guide

This document provides instructions for testing various components of the application locally.

## Report Generator

The report generator can be tested locally without deploying to AWS by following these steps:

### Recent Fixes

Several important fixes have been made to the report generator:

1. **Report Status Updates**: Fixed an issue where report statuses were not being updated in DynamoDB
   - The DynamoDBService.updateReportStatus method was only logging the update but not actually updating the database
   - Implemented the actual DynamoDB update operation using the AWS SDK
   - Handled the "metrics" reserved keyword in DynamoDB by using an expression attribute name

2. **Conversion Counting**: Fixed an issue where conversions were not being counted correctly
   - The report generator now recognizes "LOAN_ACCEPTANCE" as a conversion event (previously only looked for "CONVERSION")
   - Changed the conversion counting to count unique users who converted rather than counting all conversion events
   - This prevents statistical calculation errors and provides more accurate conversion rates

3. **UI Display**: Fixed an issue where the report page was crashing when displaying reports
   - The UI was trying to call toFixed() on null improvement values
   - Updated the ReportsPage.tsx to check for both undefined and null improvement values

### 1. Build the JAR file

```bash
cd packages/report-generator
gradle shadowJar
```

This will create a JAR file at `build/libs/report-generator.jar`.

### 2. Run the JAR file with test parameters

```bash
cd packages/report-generator
JOB_PARAMETERS='{"experimentId":"7438d25e-8c81-45ff-9984-895798f0e1a7","reportId":"9645b28c-342e-4b0f-8f58-2ddf0003ae22","timeRange":{"start":"2025-02-18T18:43:41.700Z","end":"2025-03-20T18:43:41.700Z"},"outputBucket":"experimentationstack-reportsbucket4e7c5994-cc2qvmu1uujp","outputKey":"reports/7438d25e-8c81-45ff-9984-895798f0e1a7/9645b28c-342e-4b0f-8f58-2ddf0003ae22.json"}' AWS_PROFILE=lz-demos AWS_REGION=us-west-2 java -jar build/libs/report-generator.jar
```

This command:
- Sets the `JOB_PARAMETERS` environment variable with the job configuration
- Uses the `lz-demos` AWS profile for authentication
- Sets the AWS region to `us-west-2`
- Runs the report-generator JAR file

### 3. Verify the results

After running the command, you should see output logs indicating:
- The report generator started successfully
- The report status was updated to PROCESSING
- The experiment and events were retrieved from DynamoDB
- The report was generated and uploaded to S3
- The report status was updated to COMPLETED

If there are any errors, they will be displayed in the logs.

## Deploying to AWS

After testing locally, you can deploy the report-generator to AWS using:

```bash
cd /home/q/WebstormProjects/sofi-application
npx nx run infrastructure:build-report-generator
```

This will:
1. Build the JAR file using Gradle
2. Build a Docker image
3. Log in to AWS ECR
4. Tag the Docker image
5. Push the Docker image to ECR

To deploy the entire application including the report-generator:

```bash
cd /home/q/WebstormProjects/sofi-application
npx nx run infrastructure:deploy
```

This will build and deploy all components of the application, including the report-generator.