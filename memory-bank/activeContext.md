# Active Context: Experimentation Platform Accelerator

## Current Work Focus

We are currently in the initial planning and architecture phase of the Experimentation Platform Accelerator project. The focus is on:

1. Defining the project scope and architecture
2. Setting up the memory bank documentation
3. Preparing for implementation of the NX monorepo structure
4. Planning the core components of the system

## Recent Changes

- Created the memory bank structure with core documentation files
- Defined the simplified architecture for the Experimentation Platform Accelerator
- Established implementation rules and technical constraints
- Defined the API contracts and data flows between components
- Added detailed TypeScript interfaces for all API contracts in api-contracts.md
- Updated project structure to place all monorepo packages in a `packages` directory

## Next Steps

1. **Initialize NX Monorepo**:
   - Set up the NX workspace
   - Generate the necessary projects using NX commands

2. **Implement Core Components**:
   - Create the unified web interface
   - Implement the API service
   - Set up DynamoDB tables
   - Develop the report generation job

3. **Develop Infrastructure**:
   - Create CDK code for deploying the application
   - Configure environment variables and permissions

4. **Test and Refine**:
   - Test the end-to-end workflow
   - Refine the implementation based on testing results

## Active Decisions and Considerations

### Architecture Decisions

1. **Simplified Architecture**: We've decided to simplify the architecture to make it feasible for a one-day project while still demonstrating the core concept.

2. **Single UI for All Functions**: Rather than separate UIs for different functions, we're using a single unified interface to simplify development and showcase the end-to-end workflow.

3. **DynamoDB for Event Storage**: We're using DynamoDB directly for event storage rather than a more complex event streaming solution to keep the implementation simple.

4. **AWS Batch for Report Generation**: We've chosen AWS Batch for report generation to demonstrate a different AWS service and showcase Java skills alongside TypeScript.

### Implementation Considerations

1. **NX Monorepo Structure**: We need to carefully plan the NX project structure to ensure clean separation of concerns while enabling code sharing. All monorepo packages must be placed inside a `packages` directory.

2. **TypeScript Interfaces**: The TypeScript interfaces for API contracts need to be shared between frontend and backend to ensure type safety.

3. **Environment Variable Management**: We need to ensure proper management of environment variables for both runtime and build-time configuration.

4. **Error Handling Strategy**: Following the "no fallback" rule, we need to implement proper error logging and handling throughout the application.

### Open Questions

1. How should we handle user identification in the sample page for demonstration purposes?
2. What level of statistical analysis should we include in the report generation job?
3. How should we structure the DynamoDB tables for optimal query performance?
4. What deployment strategy should we use for the frontend application?

These questions will be addressed as we move into the implementation phase of the project.