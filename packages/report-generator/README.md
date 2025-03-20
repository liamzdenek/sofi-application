# Report Generator

A Java-based AWS Batch job for generating experiment reports in the Experimentation Platform Accelerator.

## Overview

The Report Generator processes experiment event data from DynamoDB, performs statistical analysis, and generates comprehensive JSON reports that are stored in S3. It is designed to run as an AWS Batch job, triggered by the API when a user requests a report.

## Technical Stack

- **Java 11+**: Base language
- **Gradle**: Build tool for dependency management and packaging
- **Docker**: For containerization (required for AWS Batch)
- **Dagger 2**: For dependency injection
- **AWS SDK for Java v2**: For interacting with AWS services
- **Jackson**: For JSON serialization/deserialization
- **Apache Commons Math**: For statistical calculations

## Project Structure

```
packages/report-generator/
├── build.gradle                 # Gradle configuration
├── settings.gradle              # Gradle settings
├── Dockerfile                   # Docker configuration for AWS Batch
├── src/
│   ├── main/
│   │   ├── java/com/sofi/experimentation/report/
│   │   │   ├── ReportGeneratorApplication.java  # Entry point
│   │   │   ├── di/                             # Dependency injection
│   │   │   ├── model/                          # Data models
│   │   │   ├── service/                        # Business logic
│   │   │   └── util/                           # Utilities
│   │   └── resources/
│   │       └── log4j2.xml                      # Logging config
│   └── test/
│       └── java/com/sofi/experimentation/report/
│           ├── service/                        # Service tests
│           └── integration/                    # Integration tests
└── README.md                    # This file
```

## Building and Running

### Building the Project

```bash
cd packages/report-generator
./gradlew shadowJar
```

This will create a fat JAR file in `build/libs/report-generator.jar`.

### Building the Docker Image

```bash
docker build -t report-generator:latest .
```

### Running Locally

To run the application locally for testing, you can use the following command:

```bash
java -jar build/libs/report-generator.jar
```

Note that you'll need to set the following environment variables:

- `JOB_PARAMETERS`: JSON string containing the job parameters
- `AWS_REGION`: AWS region
- `DYNAMODB_EXPERIMENTS_TABLE`: DynamoDB table for experiments
- `DYNAMODB_EVENTS_TABLE`: DynamoDB table for events
- `DYNAMODB_REPORTS_TABLE`: DynamoDB table for reports

Example JOB_PARAMETERS:

```json
{
  "experimentId": "exp123",
  "reportId": "rep456",
  "timeRange": {
    "start": "2025-03-19T00:00:00Z",
    "end": "2025-03-20T23:59:59Z"
  },
  "outputBucket": "experimentation-platform-reports",
  "outputKey": "reports/exp123/rep456.json"
}
```

## AWS Batch Integration

The report generator is designed to run as an AWS Batch job. The Docker image is pushed to Amazon ECR, and the AWS Batch job definition references this ECR image.

The API triggers the AWS Batch job when a user requests a report, passing the job parameters as an environment variable.

## Statistical Analysis

The report generator performs the following statistical calculations:

- Conversion rates for each variant
- Improvement percentages compared to control
- Statistical significance (p-values) using binomial tests
- Time series data for trend analysis

## Report Format

The generated report is a JSON file with the following structure:

```json
{
  "experimentId": "exp123",
  "experimentName": "Button Color Test",
  "generatedAt": "2025-03-20T14:30:00Z",
  "timeRange": {
    "start": "2025-03-19T00:00:00Z",
    "end": "2025-03-20T23:59:59Z"
  },
  "metrics": {
    "overall": {
      "totalUsers": 1250,
      "totalEvents": 3750,
      "conversionRate": 0.15
    },
    "byVariant": {
      "var1": {
        "users": 625,
        "events": {
          "PAGE_VIEW": 625,
          "BUTTON_CLICK": 75,
          "CONVERSION": 75
        },
        "conversionRate": 0.12
      },
      "var2": {
        "users": 625,
        "events": {
          "PAGE_VIEW": 625,
          "BUTTON_CLICK": 125,
          "CONVERSION": 112
        },
        "conversionRate": 0.18,
        "improvement": 50.0,
        "significanceLevel": 0.03
      }
    },
    "timeSeries": {
      "dates": ["2025-03-19", "2025-03-20"],
      "byVariant": {
        "var1": {
          "events": [300, 325],
          "conversions": [36, 39]
        },
        "var2": {
          "events": [310, 315],
          "conversions": [56, 56]
        }
      }
    }
  }
}
```

## Testing

Tests are currently disabled in the build.gradle file. They will be implemented in a future update.

To enable tests, modify the test section in build.gradle:

```gradle
test {
    useJUnitPlatform()
    // Remove or set to true to enable tests
    enabled = false
}
```

## Todo

- Implement unit tests for service classes
- Implement integration tests for the report generation process