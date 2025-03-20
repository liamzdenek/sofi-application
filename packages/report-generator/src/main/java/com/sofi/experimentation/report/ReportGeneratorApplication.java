package com.sofi.experimentation.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sofi.experimentation.report.di.DaggerAppComponent;
import com.sofi.experimentation.report.model.ReportJobParameters;
import com.sofi.experimentation.report.service.ReportGenerationService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Main application class for the report generator.
 */
public class ReportGeneratorApplication {
    private static final Logger logger = LogManager.getLogger(ReportGeneratorApplication.class);
    
    public static void main(String[] args) {
        try {
            logger.info("Starting report generator application");
            
            // Get job parameters from environment variable
            String jobParametersJson = System.getenv("JOB_PARAMETERS");
            if (jobParametersJson == null || jobParametersJson.isEmpty()) {
                throw new IllegalArgumentException("JOB_PARAMETERS environment variable is required");
            }
            
            logger.info("Job parameters: {}", jobParametersJson);
            
            // Initialize Dagger
            var appComponent = DaggerAppComponent.builder().build();
            var objectMapper = appComponent.objectMapper();
            var reportService = appComponent.reportGenerationService();
            
            // Parse job parameters
            ReportJobParameters jobParameters = objectMapper.readValue(jobParametersJson, ReportJobParameters.class);
            
            // Generate report
            logger.info("Starting report generation for experiment: {}", jobParameters.getExperimentId());
            reportService.generateReport(jobParameters);
            logger.info("Report generation completed successfully");
            
        } catch (Exception e) {
            logger.error("Error generating report", e);
            System.exit(1);
        }
    }
}