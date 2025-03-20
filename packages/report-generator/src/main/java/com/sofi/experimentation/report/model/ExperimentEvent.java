package com.sofi.experimentation.report.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbIgnore;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.HashMap;
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
    private String metadataJson; // Store as JSON string for DynamoDB
    private Map<String, Object> metadata; // Transient field for application use
    private String timestamp;
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public ExperimentEvent() {
        // Default constructor for Jackson and DynamoDB Enhanced Client
    }
    
    @JsonProperty("id")
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    @JsonProperty("experimentId")
    @DynamoDbPartitionKey
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
    
    // This is what gets stored in DynamoDB
    @JsonProperty("metadataJson")
    public String getMetadataJson() {
        return metadataJson;
    }
    
    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
        // Parse the JSON string to populate the metadata map
        try {
            if (metadataJson != null && !metadataJson.isEmpty()) {
                this.metadata = objectMapper.readValue(metadataJson, new TypeReference<HashMap<String, Object>>() {});
            } else {
                this.metadata = new HashMap<>();
            }
        } catch (Exception e) {
            this.metadata = new HashMap<>();
        }
    }
    
    // This is used by the application but ignored by DynamoDB
    @JsonProperty("metadata")
    @DynamoDbIgnore
    public Map<String, Object> getMetadata() {
        if (metadata == null) {
            // Initialize from metadataJson if needed
            try {
                if (metadataJson != null && !metadataJson.isEmpty()) {
                    metadata = objectMapper.readValue(metadataJson, new TypeReference<HashMap<String, Object>>() {});
                } else {
                    metadata = new HashMap<>();
                }
            } catch (Exception e) {
                metadata = new HashMap<>();
            }
        }
        return metadata;
    }
    
    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
        // Update the JSON string when metadata is set
        try {
            this.metadataJson = objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            this.metadataJson = "{}";
        }
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