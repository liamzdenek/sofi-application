package com.sofi.experimentation.report.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the StatisticalAnalysisService.
 */
public class StatisticalAnalysisServiceTest {
    
    private StatisticalAnalysisService service;
    
    @BeforeEach
    public void setUp() {
        service = new StatisticalAnalysisService();
    }
    
    @Test
    public void testCalculateImprovement() {
        // Test normal case
        assertEquals(50.0, service.calculateImprovement(0.10, 0.15), 0.001);
        
        // Test negative improvement
        assertEquals(-20.0, service.calculateImprovement(0.10, 0.08), 0.001);
        
        // Test zero control rate
        assertEquals(Double.POSITIVE_INFINITY, service.calculateImprovement(0.0, 0.05));
        
        // Test zero control and treatment rates
        assertEquals(0.0, service.calculateImprovement(0.0, 0.0));
    }
    
    @Test
    public void testCalculateSignificance() {
        // Test significant result
        double pValue = service.calculateSignificance(1000, 100, 1000, 150);
        assertTrue(pValue < 0.05);
        
        // Test non-significant result
        pValue = service.calculateSignificance(100, 10, 100, 12);
        assertTrue(pValue > 0.05);
    }
    
    @Test
    public void testIsSignificant() {
        // Test significant result
        assertTrue(service.isSignificant(0.01));
        
        // Test non-significant result
        assertFalse(service.isSignificant(0.1));
        
        // Test edge case
        assertTrue(service.isSignificant(0.05));
        
        // Test with custom significance level
        assertTrue(service.isSignificant(0.1, 0.1));
        assertFalse(service.isSignificant(0.1, 0.05));
    }
}