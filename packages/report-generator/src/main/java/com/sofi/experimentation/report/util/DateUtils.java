package com.sofi.experimentation.report.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for date operations.
 */
public class DateUtils {
    
    private static final DateTimeFormatter ISO_DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    
    private DateUtils() {
        // Private constructor to prevent instantiation
    }
    
    /**
     * Convert an ISO timestamp to a date string (YYYY-MM-DD).
     *
     * @param timestamp The ISO timestamp
     * @return The date string
     */
    public static String toDateString(String timestamp) {
        Instant instant = Instant.parse(timestamp);
        LocalDate date = instant.atZone(ZoneId.systemDefault()).toLocalDate();
        return date.format(ISO_DATE_FORMATTER);
    }
    
    /**
     * Get the current timestamp in ISO format.
     *
     * @return The current timestamp
     */
    public static String getCurrentTimestamp() {
        return Instant.now().toString();
    }
    
    /**
     * Get a timestamp for a specified number of days ago.
     *
     * @param daysAgo The number of days ago
     * @return The timestamp
     */
    public static String getTimestampDaysAgo(int daysAgo) {
        return Instant.now().minusSeconds(daysAgo * 24 * 60 * 60).toString();
    }
}