import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class ExperimentationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB tables for experiment data
    const experimentsTable = new dynamodb.Table(this, 'ExperimentsTable', {
      partitionKey: { name: 'experimentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only, use RETAIN for production
    });

    // Create DynamoDB table for experiment events
    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      partitionKey: { name: 'experimentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only, use RETAIN for production
    });

    // Create S3 bucket for report storage
    const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only, use RETAIN for production
      autoDeleteObjects: true, // For development only, remove for production
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create VPC for AWS Batch
    const vpc = new ec2.Vpc(this, 'BatchVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create IAM role for AWS Batch execution
    const batchExecutionRole = new iam.Role(this, 'BatchExecutionRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
    });

    // Add permissions to the role
    batchExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole')
    );
    reportsBucket.grantReadWrite(batchExecutionRole);
    experimentsTable.grantReadData(batchExecutionRole);
    eventsTable.grantReadData(batchExecutionRole);

    // Create AWS Batch compute environment
    const computeEnvironment = new batch.CfnComputeEnvironment(this, 'ComputeEnvironment', {
      type: 'MANAGED',
      computeResources: {
        type: 'FARGATE',
        maxvCpus: 4,
        subnets: vpc.privateSubnets.map(subnet => subnet.subnetId),
        securityGroupIds: [
          new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
            vpc,
            allowAllOutbound: true,
          }).securityGroupId,
        ],
      },
      serviceRole: batchExecutionRole.roleArn,
    });

    // Create AWS Batch job queue
    new batch.CfnJobQueue(this, 'JobQueue', {
      priority: 1,
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: computeEnvironment.ref,
        },
      ],
    });

    // Output the resource ARNs
    new cdk.CfnOutput(this, 'ExperimentsTableArn', {
      value: experimentsTable.tableArn,
      description: 'ARN of the Experiments DynamoDB table',
    });

    new cdk.CfnOutput(this, 'EventsTableArn', {
      value: eventsTable.tableArn,
      description: 'ARN of the Events DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ReportsBucketArn', {
      value: reportsBucket.bucketArn,
      description: 'ARN of the Reports S3 bucket',
    });
  }
}