package com.sofi.experimentation.report.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.util.List;

/**
 * Experiment model class.
 * This class mirrors the TypeScript interface in the shared library.
 */
@DynamoDbBean
public class Experiment {
    private String id;
    private String name;
    private String description;
    private String status;
    private List<Variant> variants;
    private String createdAt;
    private String updatedAt;
    private String startDate;
    private String endDate;
    private int targetUserPercentage;
    
    public Experiment() {
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
    
    @JsonProperty("name")
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    @JsonProperty("description")
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    @JsonProperty("status")
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    @JsonProperty("variants")
    public List<Variant> getVariants() {
        return variants;
    }
    
    public void setVariants(List<Variant> variants) {
        this.variants = variants;
    }
    
    @JsonProperty("createdAt")
    public String getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    @JsonProperty("updatedAt")
    public String getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @JsonProperty("startDate")
    public String getStartDate() {
        return startDate;
    }
    
    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }
    
    @JsonProperty("endDate")
    public String getEndDate() {
        return endDate;
    }
    
    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }
    
    @JsonProperty("targetUserPercentage")
    public int getTargetUserPercentage() {
        return targetUserPercentage;
    }
    
    public void setTargetUserPercentage(int targetUserPercentage) {
        this.targetUserPercentage = targetUserPercentage;
    }
}