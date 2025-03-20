package com.sofi.experimentation.report.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;

import java.util.Map;

/**
 * Variant model class.
 * This class mirrors the TypeScript interface in the shared library.
 */
@DynamoDbBean
public class Variant {
    private String id;
    private String name;
    private Map<String, Object> config;
    
    public Variant() {
        // Default constructor for Jackson and DynamoDB Enhanced Client
    }
    
    public Variant(String id, String name, Map<String, Object> config) {
        this.id = id;
        this.name = name;
        this.config = config;
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
    
    @JsonProperty("config")
    public Map<String, Object> getConfig() {
        return config;
    }
    
    public void setConfig(Map<String, Object> config) {
        this.config = config;
    }
}