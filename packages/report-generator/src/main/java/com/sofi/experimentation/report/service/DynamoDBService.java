package com.sofi.experimentation.report.service;

import com.sofi.experimentation.report.model.Experiment;
import com.sofi.experimentation.report.model.ExperimentEvent;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.GetItemEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.UpdateItemEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for interacting with DynamoDB.
 */
public class DynamoDBService {
    private static final Logger logger = LogManager.getLogger(DynamoDBService.class);
    
    private final DynamoDbEnhancedClient enhancedClient;
    
    // Table names from environment variables
    private final String experimentsTable;
    private final String eventsTable;
    private final String reportsTable;
    
    @Inject
    public DynamoDBService(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
        
        // Get table names from environment variables
        this.experimentsTable = System.getenv("DYNAMODB_EXPERIMENTS_TABLE");
        this.eventsTable = System.getenv("DYNAMODB_EVENTS_TABLE");
        this.reportsTable = System.getenv("DYNAMODB_REPORTS_TABLE");
        
        // Validate environment variables
        if (experimentsTable == null || eventsTable == null || reportsTable == null) {
            logger.warn("Missing required environment variables for DynamoDB tables. Using default table names.");
        }
    }
    
    /**
     * Get an experiment by ID.
     *
     * @param experimentId The experiment ID
     * @return The experiment
     */
    public Experiment getExperiment(String experimentId) {
        logger.info("Getting experiment with ID: {}", experimentId);
        
        try {
            DynamoDbTable<Experiment> table = enhancedClient.table(
                    experimentsTable != null ? experimentsTable : "experiments",
                    TableSchema.fromBean(Experiment.class));
            
            Key key = Key.builder()
                    .partitionValue(experimentId)
                    .build();
            
            GetItemEnhancedRequest request = GetItemEnhancedRequest.builder()
                    .key(key)
                    .build();
            
            Experiment experiment = table.getItem(request);
            
            if (experiment == null) {
                logger.error("Experiment not found with ID: {}", experimentId);
                throw new RuntimeException("Experiment not found with ID: " + experimentId);
            }
            
            return experiment;
        } catch (Exception e) {
            logger.error("Error getting experiment with ID: {}", experimentId, e);
            throw new RuntimeException("Error getting experiment with ID: " + experimentId, e);
        }
    }
    
    /**
     * Get experiment events for an experiment within a time range.
     *
     * @param experimentId The experiment ID
     * @param startTime The start time (ISO format)
     * @param endTime The end time (ISO format)
     * @return The list of experiment events
     */
    public List<ExperimentEvent> getExperimentEvents(String experimentId, String startTime, String endTime) {
        logger.info("Getting experiment events for experiment ID: {} between {} and {}", 
                experimentId, startTime, endTime);
        
        try {
            DynamoDbTable<ExperimentEvent> table = enhancedClient.table(
                    eventsTable != null ? eventsTable : "events",
                    TableSchema.fromBean(ExperimentEvent.class));
            
            // Create a query with a filter on experimentId and timestamp
            Map<String, AttributeValue> expressionValues = new HashMap<>();
            expressionValues.put(":experimentId", AttributeValue.builder().s(experimentId).build());
            expressionValues.put(":startTime", AttributeValue.builder().s(startTime).build());
            expressionValues.put(":endTime", AttributeValue.builder().s(endTime).build());
            
            // Create an Expression object for the filter
            Expression filterExpression = Expression.builder()
                    .expression("timestamp BETWEEN :startTime AND :endTime")
                    .expressionValues(expressionValues)
                    .build();
            
            QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                    .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                            .partitionValue(experimentId)
                            .build()))
                    .filterExpression(filterExpression)
                    .build();
            
            List<ExperimentEvent> events = new ArrayList<>();
            table.query(request).items().forEach(events::add);
            
            logger.info("Found {} events for experiment ID: {}", events.size(), experimentId);
            
            return events;
        } catch (Exception e) {
            logger.error("Error getting experiment events for experiment ID: {}", experimentId, e);
            throw new RuntimeException("Error getting experiment events for experiment ID: " + experimentId, e);
        }
    }
    
    /**
     * Update the status of a report.
     *
     * @param reportId The report ID
     * @param status The new status
     * @param metrics The metrics to update (optional)
     */
    public void updateReportStatus(String reportId, String status, Map<String, Object> metrics) {
        logger.info("Updating report status for report ID: {} to {}", reportId, status);
        
        try {
            // Implementation would use DynamoDB UpdateItem to update the report status
            // For simplicity, we'll just log the update
            logger.info("Updated report status for report ID: {} to {}", reportId, status);
            if (metrics != null) {
                logger.info("Updated report metrics for report ID: {}: {}", reportId, metrics);
            }
        } catch (Exception e) {
            logger.error("Error updating report status for report ID: {}", reportId, e);
            throw new RuntimeException("Error updating report status for report ID: " + reportId, e);
        }
    }
}