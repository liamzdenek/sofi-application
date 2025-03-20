package com.sofi.experimentation.report.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.Map;

/**
 * ExperimentEvent model class.
 * This class mirrors the TypeScript interface in the shared library.
 */
@DynamoDbBean
public class ExperimentEvent {
    private String id;
    private String experimentId;
    private String variantId;
    private String userId;
    private String sessionId;
    private String action;
    private Map<String, Object> metadata;
    private String timestamp;
    
    public ExperimentEvent() {
        // Default constructor for Jackson and DynamoDB Enhanced Client
    }
    
    @JsonProperty("id")
    @DynamoDbPartitionKey
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    @JsonProperty("experimentId")
    public String getExperimentId() {
        return experimentId;
    }
    
    public void setExperimentId(String experimentId) {
        this.experimentId = experimentId;
    }
    
    @JsonProperty("variantId")
    public String getVariantId() {
        return variantId;
    }
    
    public void setVariantId(String variantId) {
        this.variantId = variantId;
    }
    
    @JsonProperty("userId")
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    @JsonProperty("sessionId")
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    @JsonProperty("action")
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    @JsonProperty("metadata")
    public Map<String, Object> getMetadata() {
        return metadata;
    }
    
    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
    
    @JsonProperty("timestamp")
    @DynamoDbSortKey
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}