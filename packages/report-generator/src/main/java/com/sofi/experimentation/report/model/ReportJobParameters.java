package com.sofi.experimentation.report.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Parameters for the report generation job.
 * This class mirrors the TypeScript interface in the shared library.
 */
public class ReportJobParameters {
    private String experimentId;
    private String reportId;
    private TimeRange timeRange;
    private String outputBucket;
    private String outputKey;
    
    public ReportJobParameters() {
        // Default constructor for Jackson
    }
    
    public ReportJobParameters(
            String experimentId,
            String reportId,
            TimeRange timeRange,
            String outputBucket,
            String outputKey) {
        this.experimentId = experimentId;
        this.reportId = reportId;
        this.timeRange = timeRange;
        this.outputBucket = outputBucket;
        this.outputKey = outputKey;
    }
    
    @JsonProperty("experimentId")
    public String getExperimentId() {
        return experimentId;
    }
    
    public void setExperimentId(String experimentId) {
        this.experimentId = experimentId;
    }
    
    @JsonProperty("reportId")
    public String getReportId() {
        return reportId;
    }
    
    public void setReportId(String reportId) {
        this.reportId = reportId;
    }
    
    @JsonProperty("timeRange")
    public TimeRange getTimeRange() {
        return timeRange;
    }
    
    public void setTimeRange(TimeRange timeRange) {
        this.timeRange = timeRange;
    }
    
    @JsonProperty("outputBucket")
    public String getOutputBucket() {
        return outputBucket;
    }
    
    public void setOutputBucket(String outputBucket) {
        this.outputBucket = outputBucket;
    }
    
    @JsonProperty("outputKey")
    public String getOutputKey() {
        return outputKey;
    }
    
    public void setOutputKey(String outputKey) {
        this.outputKey = outputKey;
    }
    
    /**
     * Time range for the report.
     */
    public static class TimeRange {
        private String start;
        private String end;
        
        public TimeRange() {
            // Default constructor for Jackson
        }
        
        public TimeRange(String start, String end) {
            this.start = start;
            this.end = end;
        }
        
        @JsonProperty("start")
        public String getStart() {
            return start;
        }
        
        public void setStart(String start) {
            this.start = start;
        }
        
        @JsonProperty("end")
        public String getEnd() {
            return end;
        }
        
        public void setEnd(String end) {
            this.end = end;
        }
    }
}