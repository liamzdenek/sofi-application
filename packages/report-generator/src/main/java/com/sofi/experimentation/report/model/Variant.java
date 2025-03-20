package com.sofi.experimentation.report.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

/**
 * Variant model class.
 * This class mirrors the TypeScript interface in the shared library.
 */
@DynamoDbBean
public class Variant {
    private String id;
    private String name;
    private String configJson; // Store as JSON string for DynamoDB
    private Map<String, Object> config; // Transient field for application use
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public Variant() {
        // Default constructor for Jackson and DynamoDB Enhanced Client
    }
    
    public Variant(String id, String name, Map<String, Object> config) {
        this.id = id;
        this.name = name;
        this.config = config;
        try {
            this.configJson = objectMapper.writeValueAsString(config);
        } catch (Exception e) {
            this.configJson = "{}";
        }
    }
    
    @JsonProperty("id")
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    @JsonProperty("name")
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    // This is what gets stored in DynamoDB
    @JsonProperty("configJson")
    public String getConfigJson() {
        return configJson;
    }
    
    public void setConfigJson(String configJson) {
        this.configJson = configJson;
        // Parse the JSON string to populate the config map
        try {
            if (configJson != null && !configJson.isEmpty()) {
                this.config = objectMapper.readValue(configJson, new TypeReference<HashMap<String, Object>>() {});
            } else {
                this.config = new HashMap<>();
            }
        } catch (Exception e) {
            this.config = new HashMap<>();
        }
    }
    
    // This is used by the application but ignored by DynamoDB
    @JsonProperty("config")
    @DynamoDbIgnore
    public Map<String, Object> getConfig() {
        if (config == null) {
            // Initialize from configJson if needed
            try {
                if (configJson != null && !configJson.isEmpty()) {
                    config = objectMapper.readValue(configJson, new TypeReference<HashMap<String, Object>>() {});
                } else {
                    config = new HashMap<>();
                }
            } catch (Exception e) {
                config = new HashMap<>();
            }
        }
        return config;
    }
    
    public void setConfig(Map<String, Object> config) {
        this.config = config;
        // Update the JSON string when config is set
        try {
            this.configJson = objectMapper.writeValueAsString(config);
        } catch (Exception e) {
            this.configJson = "{}";
        }
    }
}