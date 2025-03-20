# Experimentation Platform Accelerator

A lightweight, cloud-native platform for rapid testing and validation of new features through A/B testing.

![Experimentation Platform](https://via.placeholder.com/800x400?text=Experimentation+Platform)

## Overview

The Experimentation Platform Accelerator enables rapid testing and validation of new features through a structured approach to A/B testing. This platform addresses the challenge of innovation agility in modern organizations by providing a framework for data-driven decision making.

### Key Features

- **Simple Experiment Setup**: Create and manage A/B tests with multiple variants
- **Event Tracking**: Collect user interaction data for analysis
- **Statistical Analysis**: Generate reports with conversion rates, improvement percentages, and statistical significance
- **Sample Implementation**: Demonstrate experiments in action on a sample page
- **Cloud-Native Architecture**: Fully deployable to AWS with serverless components

## Architecture

The platform follows a simplified architecture with these core components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Interface  │────▶│   API Service   │────▶│    DynamoDB     │
│  (React + TS)   │     │ (API Gateway +  │     │  (Experiments,  │
│                 │◀────│     Lambda)     │◀────│ Events, Reports) │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │   AWS Batch     │────▶│       S3        │
                        │  (Java Report   │     │ (JSON Reports)  │
                        │   Generator)    │     │                 │
                        └─────────────────┘     └─────────────────┘
```

## Technologies Used

### Frontend
- **React**: For building the user interface
- **TypeScript**: For type-safe code
- **CSS Modules**: For component styling
- **NX**: For monorepo management and build tooling

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

## Project Structure

```
sofi-application/
├── packages/                # All monorepo packages go here
│   ├── web/                 # React web application
│   ├── api/                 # API Lambda functions
│   ├── shared/              # Shared types and utilities
│   ├── experiment-api/      # API client for experiment service
│   ├── ui-components/       # Reusable UI components
│   ├── report-generator/    # Java report generation tool
│   └── infrastructure/      # CDK infrastructure code
├── memory-bank/             # Project documentation
└── .clinerules              # Project-specific rules and patterns
```

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- Java Development Kit (JDK) 11+
- AWS CLI configured with appropriate credentials
- NX CLI installed globally

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd sofi-application
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Create `.env.development` files in the `packages/api` and `packages/web` directories
   - See the example environment variables in the Technical Context documentation

## Local Development

### Running the API

```bash
npx nx serve api
```

The API will be available at http://localhost:3333/api

### Running the Web Application

```bash
npx nx serve web
```

The web application will be available at http://localhost:4200

### Testing the Report Generator Locally

```bash
cd packages/report-generator
gradle shadowJar
JOB_PARAMETERS='{"experimentId":"your-experiment-id","reportId":"your-report-id","timeRange":{"start":"2025-02-18T18:43:41.700Z","end":"2025-03-20T18:43:41.700Z"},"outputBucket":"your-bucket-name","outputKey":"reports/your-experiment-id/your-report-id.json"}' AWS_PROFILE=your-profile AWS_REGION=us-west-2 java -jar build/libs/report-generator.jar
```

See the [Local Testing Guide](memory-bank/local-testing.md) for more details.

## Deployment

The application can be deployed to AWS using the CDK infrastructure code.

### Building and Deploying the Report Generator

```bash
npx nx run infrastructure:build-report-generator
```

### Deploying the Entire Application

```bash
npx nx run infrastructure:deploy
```

This will:
1. Build the API
2. Build the web application
3. Build and deploy the report generator Docker image to ECR
4. Deploy the CDK stack with all AWS resources

## API Documentation

The API provides endpoints for:

1. **Experiment Management**: Create, update, and retrieve experiments
2. **Event Collection**: Record user interactions with experiments
3. **Experiment Assignment**: Get active experiments for a user
4. **Report Management**: Generate and retrieve reports

Detailed API contracts are documented in [api-contracts.md](memory-bank/api-contracts.md).

## Usage Example

### Creating an Experiment

```typescript
// Example of creating a button color experiment
const createExperimentRequest = {
  name: "Button Color Test",
  description: "Testing impact of button color on conversion",
  variants: [
    {
      name: "Control",
      config: { buttonColor: "blue" }
    },
    {
      name: "Treatment",
      config: { buttonColor: "green" }
    }
  ],
  targetUserPercentage: 100
};
```

### Implementing an Experiment in a React Component

```tsx
import { useExperiment } from '@sofi-application/ui-components';
import { useExperimentEvent } from '@sofi-application/ui-components';

function CheckoutButton() {
  const { variant } = useExperiment('button-color-test');
  const trackEvent = useExperimentEvent();
  
  const buttonColor = variant?.config?.buttonColor || 'blue';
  
  const handleClick = () => {
    trackEvent('BUTTON_CLICK');
    // Process checkout
  };
  
  return (
    <button 
      style={{ backgroundColor: buttonColor }}
      onClick={handleClick}
    >
      Complete Checkout
    </button>
  );
}
```

## Project Status

The project is currently in the testing and deployment phase, with approximately 99% of the implementation completed. The application has been successfully deployed to AWS with the following endpoints:

- API: https://a9wkrb830e.execute-api.us-west-2.amazonaws.com/api/
- Web: https://dy6twvdgk8blk.cloudfront.net

## Implementation Rules

This project follows specific implementation rules:

1. **12-Factor App**: Implemented as a cloud-native application
   - Environment variables for configuration
   - Externalized configuration
   - Backing services as attached resources

2. **AWS Resource Configuration**:
   - AWS resource locations/ARNs passed through environment variables
   - Frontend environment variables available at build time

3. **Error Handling**:
   - No fallback implementation
   - Main path works or fails with proper logging
   - Fail fast and explicitly

4. **Build and Development**:
   - NX monorepo with all packages inside a `packages` directory
   - TypeScript by default
   - CSS modules for styling
   - Automated Docker image building and deployment

5. **Infrastructure**:
   - AWS-focused infrastructure
   - CDK for deployment
   - NodejsFunction primitive in CDK

For more details, see the [System Patterns](memory-bank/systemPatterns.md) documentation.

## Contributing

1. Follow the implementation rules defined in the project
2. Ensure type safety throughout the application
3. Write unit tests for critical functionality
4. Maintain the project structure and organization

## License

This project is licensed under the MIT License - see the LICENSE file for details.
