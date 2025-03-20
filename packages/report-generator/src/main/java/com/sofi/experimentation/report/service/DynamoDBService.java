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
    
    // Table names from environment variables or defaults
    private final String experimentsTable;
    private final String eventsTable;
    private final String reportsTable;
    
    // Default CDK-generated table names
    private static final String DEFAULT_EXPERIMENTS_TABLE = "ExperimentationStack-ExperimentsTable057193CB-RCDCC0YDBUCN";
    private static final String DEFAULT_EVENTS_TABLE = "ExperimentationStack-EventsTableD24865E5-3EKSMOXROFWR";
    private static final String DEFAULT_REPORTS_TABLE = "ExperimentationStack-ReportsTable282F2283-O23SUIGLRDES";
    
    @Inject
    public DynamoDBService(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
        
        // Get table names from environment variables or use defaults
        this.experimentsTable = System.getenv("DYNAMODB_EXPERIMENTS_TABLE") != null ?
                System.getenv("DYNAMODB_EXPERIMENTS_TABLE") : DEFAULT_EXPERIMENTS_TABLE;
        
        this.eventsTable = System.getenv("DYNAMODB_EVENTS_TABLE") != null ?
                System.getenv("DYNAMODB_EVENTS_TABLE") : DEFAULT_EVENTS_TABLE;
        
        this.reportsTable = System.getenv("DYNAMODB_REPORTS_TABLE") != null ?
                System.getenv("DYNAMODB_REPORTS_TABLE") : DEFAULT_REPORTS_TABLE;
        
        logger.info("Using DynamoDB tables: experiments={}, events={}, reports={}",
                experimentsTable, eventsTable, reportsTable);
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
            // Create a table schema with error handling
            TableSchema<Experiment> tableSchema;
            try {
                tableSchema = TableSchema.fromBean(Experiment.class);
            } catch (Exception e) {
                logger.error("Error creating table schema for Experiment class", e);
                throw new RuntimeException("Error creating table schema for Experiment class", e);
            }
            
            // Get the table with the schema
            DynamoDbTable<Experiment> table = enhancedClient.table(experimentsTable, tableSchema);
            
            Key key = Key.builder()
                    .partitionValue(experimentId)
                    .build();
            
            GetItemEnhancedRequest request = GetItemEnhancedRequest.builder()
                    .key(key)
                    .build();
            
            // Get the item with additional error handling
            Experiment experiment;
            try {
                experiment = table.getItem(request);
            } catch (Exception e) {
                logger.error("Error retrieving experiment from DynamoDB: {}", e.getMessage(), e);
                throw new RuntimeException("Error retrieving experiment from DynamoDB", e);
            }
            
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
                    eventsTable,
                    TableSchema.fromBean(ExperimentEvent.class));
            
            // Query by experimentId (partition key) and timestamp range (sort key)
            // For sort key, we use a key condition expression with BETWEEN
            QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                    .queryConditional(
                        QueryConditional.sortBetween(
                            Key.builder()
                                .partitionValue(experimentId)
                                .sortValue(startTime)
                                .build(),
                            Key.builder()
                                .partitionValue(experimentId)
                                .sortValue(endTime)
                                .build()
                        )
                    )
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
            // Create a new DynamoDB client
            software.amazon.awssdk.services.dynamodb.DynamoDbClient dynamoDbClient =
                software.amazon.awssdk.services.dynamodb.DynamoDbClient.create();
            
            // Create the update expression
            StringBuilder updateExpression = new StringBuilder("SET #status = :status, updatedAt = :updatedAt");
            
            // Create expression attribute values
            Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
            expressionAttributeValues.put(":status", AttributeValue.builder().s(status).build());
            expressionAttributeValues.put(":updatedAt", AttributeValue.builder().s(java.time.Instant.now().toString()).build());
            
            // Create expression attribute names
            Map<String, String> expressionAttributeNames = new HashMap<>();
            expressionAttributeNames.put("#status", "status");
            
            // Add metrics to the update if provided
            if (metrics != null) {
                // Use expression attribute name for "metrics" since it's a reserved keyword
                updateExpression.append(", #metricsAttr = :metrics");
                expressionAttributeNames.put("#metricsAttr", "metrics");
                
                // Convert metrics map to AttributeValue
                Map<String, AttributeValue> metricsMap = new HashMap<>();
                for (Map.Entry<String, Object> entry : metrics.entrySet()) {
                    if (entry.getValue() instanceof Number) {
                        metricsMap.put(entry.getKey(), AttributeValue.builder().n(entry.getValue().toString()).build());
                    } else if (entry.getValue() instanceof String) {
                        metricsMap.put(entry.getKey(), AttributeValue.builder().s((String) entry.getValue()).build());
                    } else if (entry.getValue() instanceof Boolean) {
                        metricsMap.put(entry.getKey(), AttributeValue.builder().bool((Boolean) entry.getValue()).build());
                    } else if (entry.getValue() instanceof Map) {
                        // Handle nested map (for variantCounts)
                        @SuppressWarnings("unchecked")
                        Map<String, Object> nestedMap = (Map<String, Object>) entry.getValue();
                        Map<String, AttributeValue> nestedAttributeMap = new HashMap<>();
                        
                        for (Map.Entry<String, Object> nestedEntry : nestedMap.entrySet()) {
                            if (nestedEntry.getValue() instanceof Number) {
                                nestedAttributeMap.put(nestedEntry.getKey(),
                                    AttributeValue.builder().n(nestedEntry.getValue().toString()).build());
                            } else {
                                nestedAttributeMap.put(nestedEntry.getKey(),
                                    AttributeValue.builder().s(nestedEntry.getValue().toString()).build());
                            }
                        }
                        
                        metricsMap.put(entry.getKey(), AttributeValue.builder().m(nestedAttributeMap).build());
                    } else {
                        // Default to string for other types
                        metricsMap.put(entry.getKey(), AttributeValue.builder().s(entry.getValue().toString()).build());
                    }
                }
                
                expressionAttributeValues.put(":metrics", AttributeValue.builder().m(metricsMap).build());
            }
            
            // Create the update item request
            software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest updateItemRequest =
                software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest.builder()
                    .tableName(reportsTable)
                    .key(Map.of("id", AttributeValue.builder().s(reportId).build()))
                    .updateExpression(updateExpression.toString())
                    .expressionAttributeNames(expressionAttributeNames)
                    .expressionAttributeValues(expressionAttributeValues)
                    .build();
            
            // Execute the update
            dynamoDbClient.updateItem(updateItemRequest);
            
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