# Technical Context: Experimentation Platform Accelerator

## Technologies Used

### Frontend
- **React**: For building the user interface
- **TypeScript**: For type-safe code
- **CSS Modules**: For component styling
- **NX**: For monorepo management and build tooling
- **AWS Amplify**: For simplified API integration

### Backend
- **AWS Lambda**: For serverless API implementation
- **API Gateway**: For API management
- **DynamoDB**: For data storage
- **AWS Batch**: For report generation
- **S3**: For storing generated reports
- **AWS CDK**: For infrastructure as code

### Languages
- **TypeScript**: For frontend and Lambda functions
- **Java**: For AWS Batch report generation job

## Development Setup

### Prerequisites
- Node.js (latest LTS version)
- Java Development Kit (JDK) 11+
- AWS CLI configured with appropriate credentials
- NX CLI installed globally

### Project Structure
```
sofi-application/
├── packages/                # All monorepo packages go here
│   ├── web/                 # React web application
│   ├── api/                 # API Lambda functions
│   ├── shared/              # Shared types and utilities
│   ├── experiment-api/      # API client for experiment service
│   ├── ui-components/       # Reusable UI components
│   └── report-generator/    # Java report generation tool
└── infrastructure/          # CDK infrastructure code
```

### Local Development Workflow
1. Initialize the NX workspace
2. Generate the necessary projects using NX
3. Implement the core functionality
4. Test locally using NX serve commands
5. Deploy using CDK

## Technical Constraints

### Time Constraints
- Project must be completable within one day
- Focus on core functionality over advanced features

### AWS Constraints
- All infrastructure must be deployable to AWS
- Use serverless architecture where possible
- Minimize operational complexity

### Development Constraints
- Follow the implementation rules defined in systemPatterns.md
- Ensure type safety throughout the application
- Prioritize maintainability and readability

## Dependencies

### Frontend Dependencies
- React
- React DOM
- TypeScript
- AWS Amplify
- CSS Modules
- NX

### Backend Dependencies
- AWS SDK for JavaScript
- TypeScript
- NX

### Report Generator Dependencies
- AWS SDK for Java
- Jackson for JSON processing
- Apache Commons for utilities
- JUnit for testing

### Infrastructure Dependencies
- AWS CDK
- TypeScript

## API Contracts

The API contracts between components are defined using TypeScript interfaces. The key contracts include:

1. **Experiment Management API**: For creating, updating, and retrieving experiments
2. **Event Collection API**: For recording user interactions with experiments
3. **Report Generation API**: For triggering and retrieving reports

Detailed API contracts are documented in the code using TypeScript interfaces, ensuring type safety and clear communication between components.

## Environment Configuration

Following 12-Factor principles, all configuration is externalized through environment variables:

### Frontend Environment Variables
- `REACT_APP_API_URL`: URL of the API Gateway endpoint
- `REACT_APP_REGION`: AWS region for the application

### Backend Environment Variables
- `DYNAMODB_EXPERIMENTS_TABLE`: ARN of the DynamoDB experiments table
- `DYNAMODB_EVENTS_TABLE`: ARN of the DynamoDB events table
- `DYNAMODB_REPORTS_TABLE`: ARN of the DynamoDB reports table
- `S3_REPORTS_BUCKET`: Name of the S3 bucket for reports
- `BATCH_JOB_QUEUE`: ARN of the AWS Batch job queue
- `BATCH_JOB_DEFINITION`: ARN of the AWS Batch job definition

These environment variables are managed through the CDK deployment process, ensuring consistent configuration across environments.