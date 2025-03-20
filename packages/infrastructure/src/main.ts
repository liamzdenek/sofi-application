#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ExperimentationStack } from './stacks/experimentation-stack';

const app = new cdk.App();

// Define environment
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

// Create the experimentation stack
new ExperimentationStack(app, 'ExperimentationStack', {
  env,
  description: 'Experimentation Platform Accelerator Infrastructure',
  // Cross-stack references
  crossRegionReferences: true,
  // Tags
  tags: {
    Project: 'ExperimentationPlatform',
    Environment: process.env.ENVIRONMENT || 'dev',
  },
});

app.synth();