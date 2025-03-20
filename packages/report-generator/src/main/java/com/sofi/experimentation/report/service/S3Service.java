package com.sofi.experimentation.report.service;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.inject.Inject;

/**
 * Service for interacting with S3.
 */
public class S3Service {
    private static final Logger logger = LogManager.getLogger(S3Service.class);
    
    private final S3Client s3Client;
    
    @Inject
    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }
    
    /**
     * Upload a report to S3.
     *
     * @param bucket The S3 bucket
     * @param key The S3 key
     * @param content The report content
     */
    public void uploadReport(String bucket, String key, String content) {
        logger.info("Uploading report to S3: s3://{}/{}", bucket, key);
        
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType("application/json")
                    .build();
            
            s3Client.putObject(putObjectRequest, RequestBody.fromString(content));
            
            logger.info("Successfully uploaded report to S3: s3://{}/{}", bucket, key);
        } catch (Exception e) {
            logger.error("Error uploading report to S3: s3://{}/{}", bucket, key, e);
            throw new RuntimeException("Error uploading report to S3: s3://" + bucket + "/" + key, e);
        }
    }
}