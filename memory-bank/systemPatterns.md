# System Patterns: Experimentation Platform Accelerator

## System Architecture

The Experimentation Platform Accelerator follows a simplified architecture with these core components:

1. **Unified Web Interface**: Single React application for experiment setup, viewing reports, and demonstrating experiments
2. **Unified API Service**: API Gateway + Lambda for all backend operations
3. **Data Storage**: DynamoDB for storing experiments, events, and report metadata
4. **Report Generation**: AWS Batch for processing collected data into JSON reports stored in S3

## Key Technical Decisions

### Project Structure
- **NX Monorepo**: Using NX for managing the project structure and build processes
  - All monorepo packages must be inside a `packages` directory
- **TypeScript**: Using TypeScript for type safety and better developer experience
- **CSS Modules**: For component styling without external frameworks

### Infrastructure
- **AWS Native**: Leveraging AWS services for all infrastructure components
- **CDK Deployment**: Using AWS CDK for infrastructure as code
- **12-Factor App**: Following 12-Factor principles for cloud-native application design

### Data Flow
- **Simple Event Collection**: Direct API calls for event recording
- **Batch Processing**: Asynchronous report generation using AWS Batch
- **JSON Reports**: Standardized JSON format for experiment reports

## Design Patterns

### Frontend Patterns
- **Component-Based Architecture**: Modular React components
- **Container/Presentational Pattern**: Separating data fetching from presentation
- **Custom Hooks**: For reusable logic across components

### Backend Patterns
- **API Gateway + Lambda**: Serverless API implementation
- **Single-Table Design**: Optimized DynamoDB schema
- **Event-Driven Architecture**: For report generation workflow

## Component Relationships

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

## Implementation Rules

1. **12-Factor App**: Implement as a cloud-native application
   - Use environment variables for configuration at runtime
   - Externalize all configuration
   - Treat backing services as attached resources

2. **AWS Resource Configuration**:
   - Pass location/ARN of AWS resources through environment variables
   - For front-end code, make environment variables available at build time

3. **Error Handling**:
   - No fallback implementation
   - Main path works or fails with proper logging
   - Fail fast and explicitly

4. **Build and Development**:
   - No one-off scripts, attach all scripts to `nx run` commands
   - Use an NX monorepo with all packages inside a `packages` directory
   - Initialize projects using appropriate `nx generate` commands
   - Use TypeScript by default
   - Use CSS modules, no Tailwind CSS or other CSS frameworks
   - Always use `--save` or `--save-dev` for dependencies

5. **Infrastructure**:
   - Design infrastructure for AWS
   - Deploy using CDK
   - Use NodejsFunction primitive in CDK

These patterns and rules ensure a consistent, maintainable, and scalable implementation that showcases best practices in modern application development.