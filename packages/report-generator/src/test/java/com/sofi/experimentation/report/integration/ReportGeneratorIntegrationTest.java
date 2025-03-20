package com.sofi.experimentation.report.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sofi.experimentation.report.model.*;
import com.sofi.experimentation.report.service.DynamoDBService;
import com.sofi.experimentation.report.service.ReportGenerationService;
import com.sofi.experimentation.report.service.S3Service;
import com.sofi.experimentation.report.service.StatisticalAnalysisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Integration tests for the report generation process.
 */
public class ReportGeneratorIntegrationTest {
    
    private DynamoDBService dynamoDBService;
    private S3Service s3Service;
    private StatisticalAnalysisService analysisService;
    private ReportGenerationService reportService;
    private ObjectMapper objectMapper;
    
    @BeforeEach
    public void setUp() {
        // Create mocks
        dynamoDBService = Mockito.mock(DynamoDBService.class);
        s3Service = Mockito.mock(S3Service.class);
        
        // Create real instances
        analysisService = new StatisticalAnalysisService();
        objectMapper = new ObjectMapper();
        
        // Create the service under test
        reportService = new ReportGenerationService(
                dynamoDBService,
                s3Service,
                analysisService,
                objectMapper
        );
    }
    
    @Test
    public void testGenerateReport() throws Exception {
        // Set up test data
        String experimentId = "exp123";
        String reportId = "rep456";
        String startTime = Instant.now().minusSeconds(24 * 60 * 60).toString(); // 1 day ago
        String endTime = Instant.now().toString();
        String outputBucket = "test-bucket";
        String outputKey = "test-key";
        
        // Create job parameters
        ReportJobParameters.TimeRange timeRange = new ReportJobParameters.TimeRange(startTime, endTime);
        ReportJobParameters jobParameters = new ReportJobParameters(
                experimentId,
                reportId,
                timeRange,
                outputBucket,
                outputKey
        );
        
        // Create mock experiment
        Experiment experiment = new Experiment();
        experiment.setId(experimentId);
        experiment.setName("Test Experiment");
        experiment.setDescription("A test experiment");
        experiment.setStatus("ACTIVE");
        experiment.setCreatedAt(Instant.now().minusSeconds(48 * 60 * 60).toString()); // 2 days ago
        experiment.setUpdatedAt(Instant.now().toString());
        experiment.setTargetUserPercentage(100);
        
        // Create variants
        Variant controlVariant = new Variant("var1", "Control", Map.of("buttonColor", "blue"));
        Variant treatmentVariant = new Variant("var2", "Treatment", Map.of("buttonColor", "green"));
        experiment.setVariants(List.of(controlVariant, treatmentVariant));
        
        // Create mock events
        List<ExperimentEvent> events = new ArrayList<>();
        
        // Control variant events
        for (int i = 0; i < 100; i++) {
            ExperimentEvent pageViewEvent = new ExperimentEvent();
            pageViewEvent.setId("event-" + UUID.randomUUID());
            pageViewEvent.setExperimentId(experimentId);
            pageViewEvent.setVariantId("var1");
            pageViewEvent.setUserId("user-" + i);
            pageViewEvent.setSessionId("session-" + i);
            pageViewEvent.setAction("PAGE_VIEW");
            pageViewEvent.setTimestamp(Instant.now().minusSeconds(i * 60).toString());
            events.add(pageViewEvent);
            
            // 10% conversion rate for control
            if (i < 10) {
                ExperimentEvent conversionEvent = new ExperimentEvent();
                conversionEvent.setId("event-" + UUID.randomUUID());
                conversionEvent.setExperimentId(experimentId);
                conversionEvent.setVariantId("var1");
                conversionEvent.setUserId("user-" + i);
                conversionEvent.setSessionId("session-" + i);
                conversionEvent.setAction("CONVERSION");
                conversionEvent.setTimestamp(Instant.now().minusSeconds(i * 60 + 30).toString());
                events.add(conversionEvent);
            }
        }
        
        // Treatment variant events
        for (int i = 0; i < 100; i++) {
            ExperimentEvent pageViewEvent = new ExperimentEvent();
            pageViewEvent.setId("event-" + UUID.randomUUID());
            pageViewEvent.setExperimentId(experimentId);
            pageViewEvent.setVariantId("var2");
            pageViewEvent.setUserId("user-" + (i + 100));
            pageViewEvent.setSessionId("session-" + (i + 100));
            pageViewEvent.setAction("PAGE_VIEW");
            pageViewEvent.setTimestamp(Instant.now().minusSeconds(i * 60).toString());
            events.add(pageViewEvent);
            
            // 15% conversion rate for treatment
            if (i < 15) {
                ExperimentEvent conversionEvent = new ExperimentEvent();
                conversionEvent.setId("event-" + UUID.randomUUID());
                conversionEvent.setExperimentId(experimentId);
                conversionEvent.setVariantId("var2");
                conversionEvent.setUserId("user-" + (i + 100));
                conversionEvent.setSessionId("session-" + (i + 100));
                conversionEvent.setAction("CONVERSION");
                conversionEvent.setTimestamp(Instant.now().minusSeconds(i * 60 + 30).toString());
                events.add(conversionEvent);
            }
        }
        
        // Set up mock behavior
        when(dynamoDBService.getExperiment(experimentId)).thenReturn(experiment);
        when(dynamoDBService.getExperimentEvents(eq(experimentId), any(), any())).thenReturn(events);
        
        // Capture the S3 upload
        ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);
        doNothing().when(s3Service).uploadReport(eq(outputBucket), eq(outputKey), contentCaptor.capture());
        
        // Run the report generation
        reportService.generateReport(jobParameters);
        
        // Verify interactions
        verify(dynamoDBService).updateReportStatus(eq(reportId), eq("PROCESSING"), isNull());
        verify(dynamoDBService).getExperiment(experimentId);
        verify(dynamoDBService).getExperimentEvents(eq(experimentId), eq(startTime), eq(endTime));
        verify(s3Service).uploadReport(eq(outputBucket), eq(outputKey), any());
        verify(dynamoDBService).updateReportStatus(eq(reportId), eq("COMPLETED"), any());
        
        // Verify report content
        String reportJson = contentCaptor.getValue();
        assertNotNull(reportJson);
        
        ReportData reportData = objectMapper.readValue(reportJson, ReportData.class);
        assertEquals(experimentId, reportData.getExperimentId());
        assertEquals("Test Experiment", reportData.getExperimentName());
        assertNotNull(reportData.getGeneratedAt());
        
        // Verify metrics
        ReportData.Metrics metrics = reportData.getMetrics();
        assertNotNull(metrics);
        
        // Verify overall metrics
        assertEquals(200, metrics.getOverall().getTotalUsers());
        assertEquals(225, metrics.getOverall().getTotalEvents()); // 200 page views + 25 conversions
        
        // Verify variant metrics
        Map<String, ReportData.VariantMetrics> variantMetrics = metrics.getByVariant();
        assertNotNull(variantMetrics);
        assertEquals(2, variantMetrics.size());
        
        // Verify control variant metrics
        ReportData.VariantMetrics controlMetrics = variantMetrics.get("var1");
        assertNotNull(controlMetrics);
        assertEquals(100, controlMetrics.getUsers());
        assertEquals(10, controlMetrics.getEvents().get("CONVERSION").intValue());
        assertEquals(0.1, controlMetrics.getConversionRate(), 0.001);
        
        // Verify treatment variant metrics
        ReportData.VariantMetrics treatmentMetrics = variantMetrics.get("var2");
        assertNotNull(treatmentMetrics);
        assertEquals(100, treatmentMetrics.getUsers());
        assertEquals(15, treatmentMetrics.getEvents().get("CONVERSION").intValue());
        assertEquals(0.15, treatmentMetrics.getConversionRate(), 0.001);
        assertEquals(50.0, treatmentMetrics.getImprovement(), 0.001);
        assertTrue(treatmentMetrics.getSignificanceLevel() < 0.05); // Should be statistically significant
    }
}