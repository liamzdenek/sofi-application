package com.sofi.experimentation.report.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * ReportData model class.
 * This class mirrors the TypeScript interface in the shared library.
 */
public class ReportData {
    private String experimentId;
    private String experimentName;
    private String generatedAt;
    private TimeRange timeRange;
    private Metrics metrics;
    
    public ReportData() {
        // Default constructor for Jackson
    }
    
    @JsonProperty("experimentId")
    public String getExperimentId() {
        return experimentId;
    }
    
    public void setExperimentId(String experimentId) {
        this.experimentId = experimentId;
    }
    
    @JsonProperty("experimentName")
    public String getExperimentName() {
        return experimentName;
    }
    
    public void setExperimentName(String experimentName) {
        this.experimentName = experimentName;
    }
    
    @JsonProperty("generatedAt")
    public String getGeneratedAt() {
        return generatedAt;
    }
    
    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }
    
    @JsonProperty("timeRange")
    public TimeRange getTimeRange() {
        return timeRange;
    }
    
    public void setTimeRange(TimeRange timeRange) {
        this.timeRange = timeRange;
    }
    
    @JsonProperty("metrics")
    public Metrics getMetrics() {
        return metrics;
    }
    
    public void setMetrics(Metrics metrics) {
        this.metrics = metrics;
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
    
    /**
     * Metrics for the report.
     */
    public static class Metrics {
        private Overall overall;
        private Map<String, VariantMetrics> byVariant;
        private TimeSeries timeSeries;
        
        public Metrics() {
            // Default constructor for Jackson
        }
        
        @JsonProperty("overall")
        public Overall getOverall() {
            return overall;
        }
        
        public void setOverall(Overall overall) {
            this.overall = overall;
        }
        
        @JsonProperty("byVariant")
        public Map<String, VariantMetrics> getByVariant() {
            return byVariant;
        }
        
        public void setByVariant(Map<String, VariantMetrics> byVariant) {
            this.byVariant = byVariant;
        }
        
        @JsonProperty("timeSeries")
        public TimeSeries getTimeSeries() {
            return timeSeries;
        }
        
        public void setTimeSeries(TimeSeries timeSeries) {
            this.timeSeries = timeSeries;
        }
    }
    
    /**
     * Overall metrics for the report.
     */
    public static class Overall {
        private int totalUsers;
        private int totalEvents;
        private double conversionRate;
        
        public Overall() {
            // Default constructor for Jackson
        }
        
        public Overall(int totalUsers, int totalEvents, double conversionRate) {
            this.totalUsers = totalUsers;
            this.totalEvents = totalEvents;
            this.conversionRate = conversionRate;
        }
        
        @JsonProperty("totalUsers")
        public int getTotalUsers() {
            return totalUsers;
        }
        
        public void setTotalUsers(int totalUsers) {
            this.totalUsers = totalUsers;
        }
        
        @JsonProperty("totalEvents")
        public int getTotalEvents() {
            return totalEvents;
        }
        
        public void setTotalEvents(int totalEvents) {
            this.totalEvents = totalEvents;
        }
        
        @JsonProperty("conversionRate")
        public double getConversionRate() {
            return conversionRate;
        }
        
        public void setConversionRate(double conversionRate) {
            this.conversionRate = conversionRate;
        }
    }
    
    /**
     * Metrics for a variant.
     */
    public static class VariantMetrics {
        private int users;
        private Map<String, Integer> events;
        private double conversionRate;
        private Double improvement;
        private Double significanceLevel;
        
        public VariantMetrics() {
            // Default constructor for Jackson
        }
        
        @JsonProperty("users")
        public int getUsers() {
            return users;
        }
        
        public void setUsers(int users) {
            this.users = users;
        }
        
        @JsonProperty("events")
        public Map<String, Integer> getEvents() {
            return events;
        }
        
        public void setEvents(Map<String, Integer> events) {
            this.events = events;
        }
        
        @JsonProperty("conversionRate")
        public double getConversionRate() {
            return conversionRate;
        }
        
        public void setConversionRate(double conversionRate) {
            this.conversionRate = conversionRate;
        }
        
        @JsonProperty("improvement")
        public Double getImprovement() {
            return improvement;
        }
        
        public void setImprovement(Double improvement) {
            this.improvement = improvement;
        }
        
        @JsonProperty("significanceLevel")
        public Double getSignificanceLevel() {
            return significanceLevel;
        }
        
        public void setSignificanceLevel(Double significanceLevel) {
            this.significanceLevel = significanceLevel;
        }
    }
    
    /**
     * Time series data for the report.
     */
    public static class TimeSeries {
        private List<String> dates;
        private Map<String, VariantTimeSeries> byVariant;
        
        public TimeSeries() {
            // Default constructor for Jackson
        }
        
        @JsonProperty("dates")
        public List<String> getDates() {
            return dates;
        }
        
        public void setDates(List<String> dates) {
            this.dates = dates;
        }
        
        @JsonProperty("byVariant")
        public Map<String, VariantTimeSeries> getByVariant() {
            return byVariant;
        }
        
        public void setByVariant(Map<String, VariantTimeSeries> byVariant) {
            this.byVariant = byVariant;
        }
    }
    
    /**
     * Time series data for a variant.
     */
    public static class VariantTimeSeries {
        private List<Integer> events;
        private List<Integer> conversions;
        
        public VariantTimeSeries() {
            // Default constructor for Jackson
        }
        
        @JsonProperty("events")
        public List<Integer> getEvents() {
            return events;
        }
        
        public void setEvents(List<Integer> events) {
            this.events = events;
        }
        
        @JsonProperty("conversions")
        public List<Integer> getConversions() {
            return conversions;
        }
        
        public void setConversions(List<Integer> conversions) {
            this.conversions = conversions;
        }
    }
}