package com.sofi.experimentation.report.di;

import com.fasterxml.jackson.databind.ObjectMapper;
import dagger.Module;
import dagger.Provides;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.s3.S3Client;
import javax.inject.Singleton;

/**
 * Dagger module for providing application-level dependencies.
 */
@Module
public class AppModule {
    
    @Provides
    @Singleton
    ObjectMapper provideObjectMapper() {
        return new ObjectMapper();
    }
    
    @Provides
    @Singleton
    DynamoDbClient provideDynamoDbClient() {
        return DynamoDbClient.builder()
            .region(Region.of(System.getenv("AWS_REGION") != null ? System.getenv("AWS_REGION") : "us-east-1"))
            .build();
    }
    
    @Provides
    @Singleton
    DynamoDbEnhancedClient provideDynamoDbEnhancedClient(DynamoDbClient dynamoDbClient) {
        return DynamoDbEnhancedClient.builder()
            .dynamoDbClient(dynamoDbClient)
            .build();
    }
    
    @Provides
    @Singleton
    S3Client provideS3Client() {
        return S3Client.builder()
            .region(Region.of(System.getenv("AWS_REGION") != null ? System.getenv("AWS_REGION") : "us-east-1"))
            .build();
    }
}