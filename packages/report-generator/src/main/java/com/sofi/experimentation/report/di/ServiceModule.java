package com.sofi.experimentation.report.di;

import com.sofi.experimentation.report.service.DynamoDBService;
import com.sofi.experimentation.report.service.ReportGenerationService;
import com.sofi.experimentation.report.service.S3Service;
import com.sofi.experimentation.report.service.StatisticalAnalysisService;
import dagger.Module;
import dagger.Provides;
import javax.inject.Singleton;

/**
 * Dagger module for providing service-level dependencies.
 */
@Module
public class ServiceModule {
    
    @Provides
    @Singleton
    DynamoDBService provideDynamoDBService(
            software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient enhancedClient) {
        return new DynamoDBService(enhancedClient);
    }
    
    @Provides
    @Singleton
    S3Service provideS3Service(software.amazon.awssdk.services.s3.S3Client s3Client) {
        return new S3Service(s3Client);
    }
    
    @Provides
    @Singleton
    StatisticalAnalysisService provideStatisticalAnalysisService() {
        return new StatisticalAnalysisService();
    }
    
    @Provides
    @Singleton
    ReportGenerationService provideReportGenerationService(
            DynamoDBService dynamoDBService,
            S3Service s3Service,
            StatisticalAnalysisService statisticalAnalysisService,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        return new ReportGenerationService(
                dynamoDBService,
                s3Service,
                statisticalAnalysisService,
                objectMapper);
    }
}