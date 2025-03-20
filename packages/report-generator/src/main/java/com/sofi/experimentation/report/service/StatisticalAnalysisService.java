package com.sofi.experimentation.report.service;

import org.apache.commons.math3.stat.inference.AlternativeHypothesis;
import org.apache.commons.math3.stat.inference.BinomialTest;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javax.inject.Inject;

/**
 * Service for performing statistical analysis on experiment data.
 */
public class StatisticalAnalysisService {
    private static final Logger logger = LogManager.getLogger(StatisticalAnalysisService.class);
    
    @Inject
    public StatisticalAnalysisService() {
        // Default constructor
    }
    
    /**
     * Calculate the improvement percentage of treatment over control.
     *
     * @param controlRate The control conversion rate
     * @param treatmentRate The treatment conversion rate
     * @return The improvement percentage
     */
    public double calculateImprovement(double controlRate, double treatmentRate) {
        if (controlRate == 0) {
            return treatmentRate > 0 ? Double.POSITIVE_INFINITY : 0;
        }
        return ((treatmentRate - controlRate) / controlRate) * 100;
    }
    
    /**
     * Calculate statistical significance using binomial test.
     *
     * @param controlUsers The number of users in the control group
     * @param controlConversions The number of conversions in the control group
     * @param treatmentUsers The number of users in the treatment group
     * @param treatmentConversions The number of conversions in the treatment group
     * @return The p-value
     */
    public double calculateSignificance(int controlUsers, int controlConversions, 
                                       int treatmentUsers, int treatmentConversions) {
        try {
            BinomialTest binomialTest = new BinomialTest();
            
            // Calculate control conversion rate
            double controlRate = (double) controlConversions / controlUsers;
            
            // Perform binomial test
            return binomialTest.binomialTest(
                treatmentUsers, 
                treatmentConversions, 
                controlRate, 
                AlternativeHypothesis.TWO_SIDED
            );
        } catch (Exception e) {
            logger.error("Error calculating statistical significance", e);
            return Double.NaN;
        }
    }
    
    /**
     * Determine if a result is statistically significant.
     *
     * @param pValue The p-value
     * @param significanceLevel The significance level (default: 0.05)
     * @return True if the result is statistically significant
     */
    public boolean isSignificant(double pValue, double significanceLevel) {
        return !Double.isNaN(pValue) && pValue <= significanceLevel;
    }
    
    /**
     * Determine if a result is statistically significant using the default significance level (0.05).
     *
     * @param pValue The p-value
     * @return True if the result is statistically significant
     */
    public boolean isSignificant(double pValue) {
        return isSignificant(pValue, 0.05);
    }
}