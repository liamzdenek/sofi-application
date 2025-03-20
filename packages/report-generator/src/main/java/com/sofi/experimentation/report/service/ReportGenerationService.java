package com.sofi.experimentation.report.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sofi.experimentation.report.model.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javax.inject.Inject;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating experiment reports.
 */
public class ReportGenerationService {
    private static final Logger logger = LogManager.getLogger(ReportGenerationService.class);
    
    private final DynamoDBService dynamoDBService;
    private final S3Service s3Service;
    private final StatisticalAnalysisService analysisService;
    private final ObjectMapper objectMapper;
    
    @Inject
    public ReportGenerationService(
            DynamoDBService dynamoDBService,
            S3Service s3Service,
            StatisticalAnalysisService analysisService,
            ObjectMapper objectMapper) {
        this.dynamoDBService = dynamoDBService;
        this.s3Service = s3Service;
        this.analysisService = analysisService;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Generate a report for an experiment.
     *
     * @param jobParameters The job parameters
     */
    public void generateReport(ReportJobParameters jobParameters) {
        try {
            logger.info("Generating report for experiment: {}", jobParameters.getExperimentId());
            
            // Update report status to PROCESSING
            dynamoDBService.updateReportStatus(jobParameters.getReportId(), "PROCESSING", null);
            
            // Fetch experiment data
            Experiment experiment = dynamoDBService.getExperiment(jobParameters.getExperimentId());
            
            // Fetch events for the experiment within the time range
            List<ExperimentEvent> events = dynamoDBService.getExperimentEvents(
                    jobParameters.getExperimentId(),
                    jobParameters.getTimeRange().getStart(),
                    jobParameters.getTimeRange().getEnd()
            );
            
            // Generate report data
            ReportData reportData = generateReportData(experiment, events, jobParameters);
            
            // Convert to JSON
            String reportJson = objectMapper.writeValueAsString(reportData);
            
            // Upload to S3
            s3Service.uploadReport(
                    jobParameters.getOutputBucket(),
                    jobParameters.getOutputKey(),
                    reportJson
            );
            
            // Calculate summary metrics
            Map<String, Object> metrics = calculateSummaryMetrics(reportData);
            
            // Update report status to COMPLETED
            dynamoDBService.updateReportStatus(
                    jobParameters.getReportId(),
                    "COMPLETED",
                    metrics
            );
            
            logger.info("Report generation completed for experiment: {}", jobParameters.getExperimentId());
        } catch (Exception e) {
            logger.error("Error generating report for experiment: {}", jobParameters.getExperimentId(), e);
            
            try {
                // Update report status to FAILED
                dynamoDBService.updateReportStatus(
                        jobParameters.getReportId(),
                        "FAILED",
                        null
                );
            } catch (Exception updateError) {
                logger.error("Error updating report status to FAILED", updateError);
            }
            
            throw new RuntimeException("Failed to generate report for experiment: " + jobParameters.getExperimentId(), e);
        }
    }
    
    /**
     * Generate report data from experiment and events.
     *
     * @param experiment The experiment
     * @param events The experiment events
     * @param jobParameters The job parameters
     * @return The report data
     */
    private ReportData generateReportData(Experiment experiment, List<ExperimentEvent> events, ReportJobParameters jobParameters) {
        logger.info("Generating report data for experiment: {}", experiment.getId());
        
        // Create report data object
        ReportData reportData = new ReportData();
        reportData.setExperimentId(experiment.getId());
        reportData.setExperimentName(experiment.getName());
        reportData.setGeneratedAt(Instant.now().toString());
        
        // Set time range
        ReportData.TimeRange timeRange = new ReportData.TimeRange();
        timeRange.setStart(jobParameters.getTimeRange().getStart());
        timeRange.setEnd(jobParameters.getTimeRange().getEnd());
        reportData.setTimeRange(timeRange);
        
        // Group events by variant
        Map<String, List<ExperimentEvent>> eventsByVariant = events.stream()
                .collect(Collectors.groupingBy(ExperimentEvent::getVariantId));
        
        // Group events by user
        Map<String, Set<String>> usersByVariant = new HashMap<>();
        for (ExperimentEvent event : events) {
            usersByVariant.computeIfAbsent(event.getVariantId(), k -> new HashSet<>())
                    .add(event.getUserId());
        }
        
        // Calculate metrics
        ReportData.Metrics metrics = calculateMetrics(experiment, events, eventsByVariant, usersByVariant);
        reportData.setMetrics(metrics);
        
        return reportData;
    }
    
    /**
     * Calculate metrics for the report.
     *
     * @param experiment The experiment
     * @param events The experiment events
     * @param eventsByVariant The events grouped by variant
     * @param usersByVariant The users grouped by variant
     * @return The metrics
     */
    private ReportData.Metrics calculateMetrics(
            Experiment experiment,
            List<ExperimentEvent> events,
            Map<String, List<ExperimentEvent>> eventsByVariant,
            Map<String, Set<String>> usersByVariant) {
        
        ReportData.Metrics metrics = new ReportData.Metrics();
        
        // Calculate overall metrics
        int totalUsers = usersByVariant.values().stream()
                .mapToInt(Set::size)
                .sum();
        
        int totalEvents = events.size();
        
        // Count unique users who have at least one conversion event (LOAN_ACCEPTANCE is considered a conversion)
        Set<String> convertedUsers = events.stream()
                .filter(e -> "LOAN_ACCEPTANCE".equals(e.getAction()) || "CONVERSION".equals(e.getAction()))
                .map(ExperimentEvent::getUserId)
                .collect(Collectors.toSet());
        
        long totalConversions = convertedUsers.size();
        double overallConversionRate = totalUsers > 0 ? (double) totalConversions / totalUsers : 0;
        
        ReportData.Overall overall = new ReportData.Overall();
        overall.setTotalUsers(totalUsers);
        overall.setTotalEvents(totalEvents);
        overall.setConversionRate(overallConversionRate);
        metrics.setOverall(overall);
        
        // Calculate metrics by variant
        Map<String, ReportData.VariantMetrics> variantMetrics = new HashMap<>();
        
        // Safety check for variants
        if (experiment.getVariants() == null || experiment.getVariants().isEmpty()) {
            logger.warn("No variants found in experiment {}. Using empty metrics.", experiment.getId());
            metrics.setByVariant(variantMetrics);
            metrics.setTimeSeries(new ReportData.TimeSeries());
            return metrics;
        }
        
        // Find control variant (first variant is assumed to be control)
        String controlVariantId = experiment.getVariants().get(0).getId();
        
        for (Variant variant : experiment.getVariants()) {
            String variantId = variant.getId();
            List<ExperimentEvent> variantEvents = eventsByVariant.getOrDefault(variantId, Collections.emptyList());
            Set<String> variantUsers = usersByVariant.getOrDefault(variantId, Collections.emptySet());
            
            // Count events by action
            Map<String, Integer> eventCounts = variantEvents.stream()
                    .collect(Collectors.groupingBy(
                            ExperimentEvent::getAction,
                            Collectors.summingInt(e -> 1)
                    ));
            
            // Count unique users who have converted (LOAN_ACCEPTANCE or CONVERSION)
            Set<String> variantConvertedUsers = variantEvents.stream()
                    .filter(e -> "LOAN_ACCEPTANCE".equals(e.getAction()) || "CONVERSION".equals(e.getAction()))
                    .map(ExperimentEvent::getUserId)
                    .collect(Collectors.toSet());
            
            int conversions = variantConvertedUsers.size();
            double conversionRate = variantUsers.size() > 0 ? (double) conversions / variantUsers.size() : 0;
            
            ReportData.VariantMetrics variantMetric = new ReportData.VariantMetrics();
            variantMetric.setUsers(variantUsers.size());
            variantMetric.setEvents(eventCounts);
            variantMetric.setConversionRate(conversionRate);
            
            // Store the conversions count in a custom field in the events map
            eventCounts.put("__CONVERSIONS_COUNT", conversions);
            
            variantMetrics.put(variantId, variantMetric);
            
            // For non-control variants, we need to wait until the control variant is processed
            // to calculate improvement and significance
        }
        
        // Now calculate improvement and significance for non-control variants
        // This ensures the control variant metrics are already in the map
        if (variantMetrics.containsKey(controlVariantId)) {
            double controlConversionRate = variantMetrics.get(controlVariantId).getConversionRate();
            int controlUsers = variantMetrics.get(controlVariantId).getUsers();
            // Get the conversions count from the events map
            int controlConversions = variantMetrics.get(controlVariantId).getEvents().getOrDefault("__CONVERSIONS_COUNT", 0);
            
            for (Variant variant : experiment.getVariants()) {
                String variantId = variant.getId();
                
                // Skip the control variant
                if (variantId.equals(controlVariantId)) {
                    continue;
                }
                
                // Get the variant metrics
                ReportData.VariantMetrics variantMetric = variantMetrics.get(variantId);
                if (variantMetric == null) {
                    continue;
                }
                
                try {
                    // Calculate improvement
                    double improvement = analysisService.calculateImprovement(
                            controlConversionRate,
                            variantMetric.getConversionRate()
                    );
                    variantMetric.setImprovement(improvement);
                    
                    // Calculate statistical significance
                    double pValue = analysisService.calculateSignificance(
                            controlUsers,
                            controlConversions,
                            variantMetric.getUsers(),
                            variantMetric.getEvents().getOrDefault("__CONVERSIONS_COUNT", 0)
                    );
                    variantMetric.setSignificanceLevel(pValue);
                } catch (Exception e) {
                    logger.warn("Error calculating metrics for variant {}: {}", variantId, e.getMessage());
                    // Set default values
                    variantMetric.setImprovement(0.0);
                    variantMetric.setSignificanceLevel(1.0);
                }
            }
        }
        
        metrics.setByVariant(variantMetrics);
        
        // Calculate time series data
        try {
            metrics.setTimeSeries(calculateTimeSeries(events, eventsByVariant));
        } catch (Exception e) {
            logger.warn("Error calculating time series data: {}", e.getMessage());
            metrics.setTimeSeries(new ReportData.TimeSeries());
        }
        
        return metrics;
    }
    
    /**
     * Calculate time series data for the report.
     *
     * @param events The experiment events
     * @param eventsByVariant The events grouped by variant
     * @return The time series data
     */
    private ReportData.TimeSeries calculateTimeSeries(
            List<ExperimentEvent> events,
            Map<String, List<ExperimentEvent>> eventsByVariant) {
        
        ReportData.TimeSeries timeSeries = new ReportData.TimeSeries();
        
        // Group events by date
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        
        // Get all unique dates
        Set<String> uniqueDates = events.stream()
                .map(e -> {
                    Instant instant = Instant.parse(e.getTimestamp());
                    LocalDate date = instant.atZone(ZoneId.systemDefault()).toLocalDate();
                    return date.format(formatter);
                })
                .collect(Collectors.toSet());
        
        List<String> sortedDates = new ArrayList<>(uniqueDates);
        Collections.sort(sortedDates);
        timeSeries.setDates(sortedDates);
        
        // Calculate time series data by variant
        Map<String, ReportData.VariantTimeSeries> variantTimeSeries = new HashMap<>();
        
        for (Map.Entry<String, List<ExperimentEvent>> entry : eventsByVariant.entrySet()) {
            String variantId = entry.getKey();
            List<ExperimentEvent> variantEvents = entry.getValue();
            
            // Group events by date
            Map<String, List<ExperimentEvent>> eventsByDate = variantEvents.stream()
                    .collect(Collectors.groupingBy(e -> {
                        Instant instant = Instant.parse(e.getTimestamp());
                        LocalDate date = instant.atZone(ZoneId.systemDefault()).toLocalDate();
                        return date.format(formatter);
                    }));
            
            // Calculate events and conversions by date
            List<Integer> eventCounts = new ArrayList<>();
            List<Integer> conversionCounts = new ArrayList<>();
            
            for (String date : sortedDates) {
                List<ExperimentEvent> dateEvents = eventsByDate.getOrDefault(date, Collections.emptyList());
                eventCounts.add(dateEvents.size());
                
                // Count unique users who converted on this date
                Set<String> dateConvertedUsers = dateEvents.stream()
                        .filter(e -> "LOAN_ACCEPTANCE".equals(e.getAction()) || "CONVERSION".equals(e.getAction()))
                        .map(ExperimentEvent::getUserId)
                        .collect(Collectors.toSet());
                
                long conversions = dateConvertedUsers.size();
                conversionCounts.add((int) conversions);
            }
            
            ReportData.VariantTimeSeries variantTS = new ReportData.VariantTimeSeries();
            variantTS.setEvents(eventCounts);
            variantTS.setConversions(conversionCounts);
            
            variantTimeSeries.put(variantId, variantTS);
        }
        
        timeSeries.setByVariant(variantTimeSeries);
        
        return timeSeries;
    }
    
    /**
     * Calculate summary metrics for the report metadata.
     *
     * @param reportData The report data
     * @return The summary metrics
     */
    private Map<String, Object> calculateSummaryMetrics(ReportData reportData) {
        Map<String, Object> metrics = new HashMap<>();
        
        // Add total events
        metrics.put("totalEvents", reportData.getMetrics().getOverall().getTotalEvents());
        
        // Add variant counts
        Map<String, Integer> variantCounts = new HashMap<>();
        for (Map.Entry<String, ReportData.VariantMetrics> entry : reportData.getMetrics().getByVariant().entrySet()) {
            variantCounts.put(entry.getKey(), entry.getValue().getUsers());
        }
        metrics.put("variantCounts", variantCounts);
        
        return metrics;
    }
}