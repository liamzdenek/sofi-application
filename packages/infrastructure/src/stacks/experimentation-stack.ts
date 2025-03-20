import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as fs from 'fs';

// Helper function to find the git root
const findGitRoot = (startPath: string): string => {
  let currentPath = startPath;
  while (currentPath !== '/') {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  throw new Error('Could not find .git directory');
};

export class ExperimentationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Find project root
    const projectRoot = findGitRoot(__dirname);
    console.log('Project root:', projectRoot);

    // Create DynamoDB tables for experiment data
    const experimentsTable = new dynamodb.Table(this, 'ExperimentsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
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

    // Create DynamoDB table for report metadata
    const reportsTable = new dynamodb.Table(this, 'ReportsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only, use RETAIN for production
    });

    // Add GSI for querying reports by experimentId
    reportsTable.addGlobalSecondaryIndex({
      indexName: 'experimentId-index',
      partitionKey: { name: 'experimentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Create S3 bucket for report storage
    const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only, use RETAIN for production
      autoDeleteObjects: true, // For development only, remove for production
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create S3 bucket for web hosting
    const webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      autoDeleteObjects: true, // For development only
    });

    // Create CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'WebOriginAccessIdentity');
    webBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(webBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Create IAM role for AWS Batch execution
    const batchExecutionRole = new iam.Role(this, 'BatchExecutionRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
    });

    // Create IAM role for task execution
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add permissions to the roles
    batchExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole')
    );
    taskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );
    
    reportsBucket.grantReadWrite(taskExecutionRole);
    experimentsTable.grantReadData(taskExecutionRole);
    eventsTable.grantReadData(taskExecutionRole);

    // Create ECR repository for report generator Docker image
    const reportGeneratorRepo = new ecr.Repository(this, 'ReportGeneratorRepo', {
      repositoryName: 'experimentation-report-generator',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });
    
    // Grant pull permissions to the task execution role
    reportGeneratorRepo.grantPull(taskExecutionRole);

    // Create VPC for AWS Batch
    const batchVpc = new ec2.Vpc(this, 'BatchVpc', {
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });
    
    // Create security group for AWS Batch tasks
    const batchSecurityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
      vpc: batchVpc,
      description: 'Security group for AWS Batch tasks',
      allowAllOutbound: true, // Allow outbound traffic to the internet
    });
    
    // Create AWS Batch compute environment with a new name to avoid update issues
    const computeEnvironment = new batch.FargateComputeEnvironment(this, 'ComputeEnvironmentV2', {
      maxvCpus: 4,
      spot: false,
      vpc: batchVpc,
      securityGroups: [batchSecurityGroup],
      serviceRole: batchExecutionRole
    });

    // Create AWS Batch job queue with a new name to avoid update issues
    const jobQueue = new batch.CfnJobQueue(this, 'JobQueueV2', {
      priority: 1,
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: computeEnvironment.computeEnvironmentArn,
        },
      ],
    });

    // Create AWS Batch job definition with a new name to avoid update issues
    const jobDefinition = new batch.CfnJobDefinition(this, 'ReportGeneratorJobDefinitionV2', {
      type: 'container',
      containerProperties: {
        image: `${reportGeneratorRepo.repositoryUri}:latest`,
        fargatePlatformConfiguration: {
          platformVersion: 'LATEST',
        },
        resourceRequirements: [
          { type: 'VCPU', value: '1' },
          { type: 'MEMORY', value: '2048' },
        ],
        executionRoleArn: taskExecutionRole.roleArn,
        jobRoleArn: taskExecutionRole.roleArn,
        environment: [
          { name: 'DYNAMODB_EXPERIMENTS_TABLE', value: experimentsTable.tableName },
          { name: 'DYNAMODB_EVENTS_TABLE', value: eventsTable.tableName },
          { name: 'S3_REPORTS_BUCKET', value: reportsBucket.bucketName },
        ],
        networkConfiguration: {
          assignPublicIp: 'ENABLED'
        },
      },
      platformCapabilities: ['FARGATE'],
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'ExperimentationApi', {
      description: 'Experimentation Platform API',
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    // Create Lambda function for API
    const apiEntryPath = path.join(projectRoot, 'packages/api/src/lambda.ts');
    console.log('API entry path:', apiEntryPath);
    console.log('File exists:', fs.existsSync(apiEntryPath));
    
    const apiFunction = new NodejsFunction(this, 'ApiFunction', {
      entry: apiEntryPath,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        DYNAMODB_EXPERIMENTS_TABLE: experimentsTable.tableName,
        DYNAMODB_EVENTS_TABLE: eventsTable.tableName,
        DYNAMODB_REPORTS_TABLE: reportsTable.tableName,
        S3_REPORTS_BUCKET: reportsBucket.bucketName,
        BATCH_JOB_QUEUE: jobQueue.ref,
        BATCH_JOB_DEFINITION: jobDefinition.ref,
        NODE_ENV: 'production',
      },
    });

    // Grant permissions to Lambda function
    experimentsTable.grantReadWriteData(apiFunction);
    eventsTable.grantReadWriteData(apiFunction);
    reportsTable.grantReadWriteData(apiFunction);
    reportsBucket.grantReadWrite(apiFunction);

    // Add permissions for AWS Batch
    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['batch:SubmitJob'],
        resources: [jobQueue.ref, jobDefinition.ref],
      })
    );

    // Add API Gateway proxy integration
    api.root.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(apiFunction, {
        proxy: true,
        allowTestInvoke: true,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      anyMethod: true,
    });

    // Output the resource ARNs and URLs
    new cdk.CfnOutput(this, 'ExperimentsTableArn', {
      value: experimentsTable.tableArn,
      description: 'ARN of the Experiments DynamoDB table',
    });

    new cdk.CfnOutput(this, 'EventsTableArn', {
      value: eventsTable.tableArn,
      description: 'ARN of the Events DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ReportsTableArn', {
      value: reportsTable.tableArn,
      description: 'ARN of the Reports DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ReportsBucketArn', {
      value: reportsBucket.bucketArn,
      description: 'ARN of the Reports S3 bucket',
    });

    new cdk.CfnOutput(this, 'WebBucketName', {
      value: webBucket.bucketName,
      description: 'Name of the Web S3 bucket',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'WebUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'URL of the CloudFront distribution',
    });

    new cdk.CfnOutput(this, 'ReportGeneratorRepoUri', {
      value: reportGeneratorRepo.repositoryUri,
      description: 'URI of the ECR repository for the report generator',
    });

    new cdk.CfnOutput(this, 'WebDistributionId', {
      value: distribution.distributionId,
      description: 'ID of the CloudFront distribution',
    });
    
    // Deploy web application to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(projectRoot, 'dist/packages/web'))],
      destinationBucket: webBucket,
      distribution: distribution,
      distributionPaths: ['/*'], // Invalidate all files
      memoryLimit: 1024,
    });
  }
}