import React, { useState, useCallback, useEffect } from 'react';
import {
  ExperimentVariant,
  useExperiment,
  useExperimentEvent,
  useExperimentContext
} from '@sofi-application/ui-components';
import { ExperimentSelector } from '../components/ExperimentSelector';
import { LoadingScreen } from '../components/LoadingScreen';
import { ExperimentApiClient, Experiment } from '@sofi-application/shared';
import styles from './SamplePage.module.css';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.VITE_EXPERIMENTATION_API_URL || process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

// Helper function to generate a random session ID
const generateSessionId = () => `session-${Math.floor(Math.random() * 1000000)}`;

export function SamplePage() {
  const [loanAccepted, setLoanAccepted] = useState(false);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [availableExperiments, setAvailableExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For demo purposes, we'll use a fixed user ID but allow session ID to be refreshed
  const userId = 'user-123';
  const [sessionId, setSessionId] = useState(generateSessionId());
  
  // Loan details
  const loanAmount = 25000;
  const interestRate = 5.99;
  const loanTerm = 60; // months
  const monthlyPayment = 483.15;
  
  // Use the experiment hook to get experiment data for the current user
  const { experiments, loading: experimentsLoading } = useExperiment(userId, sessionId);
  
  // Use the experiment event hook to record events
  const { recordEvent } = useExperimentEvent(userId, sessionId);
  
  // Use the experiment context to access the refreshExperiments function
  const experimentContext = useExperimentContext();
  
  // Fetch all active experiments for the selector
  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setLoading(true);
        const apiClient = new ExperimentApiClient(API_URL);
        const response = await apiClient.listExperiments({ status: 'ACTIVE' });
        setAvailableExperiments(response.experiments);
        
        // Auto-select the first experiment if available
        if (response.experiments.length > 0 && !selectedExperimentId) {
          setSelectedExperimentId(response.experiments[0].id);
        }
      } catch (err) {
        console.error('Error fetching experiments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiments();
  }, [selectedExperimentId]);
  
  // Handle experiment selection
  const handleSelectExperiment = useCallback((experimentId: string) => {
    setSelectedExperimentId(experimentId);
  }, []);
  
  // Handle accept loan button click
  const handleAcceptLoan = (experimentId: string, variantId: string) => {
    // Record the loan acceptance event
    recordEvent(experimentId, variantId, 'LOAN_ACCEPTANCE', {
      loanAmount: loanAmount,
      interestRate: interestRate,
      loanTerm: loanTerm
    });
    
    // Simulate a successful loan acceptance
    setLoanAccepted(true);
  };
  
  // Find the selected experiment from available experiments
  const selectedExperiment = availableExperiments.find(exp => exp.id === selectedExperimentId);
  
  // Find the assigned variant for the selected experiment
  const assignedVariant = experiments.find(exp => exp.experimentId === selectedExperimentId);
  
  // Get the button color from the experiment or use a default
  const getButtonColor = () => {
    if (selectedExperiment && assignedVariant && assignedVariant.config.buttonColor) {
      return assignedVariant.config.buttonColor;
    }
    return '#2dcccd'; // SoFi teal color
  };

  // Determine if we're in a loading state
  const isLoading = loading || experimentsLoading;

  return (
    <div className={styles.container}>
      {isLoading && <LoadingScreen message="Loading experiment data..." />}
      <div className={styles.header}>
        <h1 className={styles.title}>SoFi Personal Loan Acceptance</h1>
        <p className={styles.description}>
          Congratulations! Your personal loan has been approved. Review the details below and accept your loan offer.
        </p>
        
        <div className={styles.sessionInfo}>
          <p>Current Session ID: <code>{sessionId}</code></p>
          <button
            className={styles.refreshButton}
            onClick={async () => {
              try {
                // Show loading state
                setLoading(true);
                
                // Generate new session ID
                const newSessionId = generateSessionId();
                setSessionId(newSessionId);
                
                // Reset loan accepted state
                setLoanAccepted(false);
                
                // Refresh experiments with new session ID
                await experimentContext.refreshExperiments();
                
                // Also refresh available experiments list
                const apiClient = new ExperimentApiClient(API_URL);
                const response = await apiClient.listExperiments({ status: 'ACTIVE' });
                setAvailableExperiments(response.experiments);
                
                // Auto-select the first experiment if available
                if (response.experiments.length > 0 && !selectedExperimentId) {
                  setSelectedExperimentId(response.experiments[0].id);
                }
              } catch (err) {
                console.error('Error fetching experiments:', err);
              } finally {
                setLoading(false);
              }
            }}
          >
            Refresh Session (Get New Variant)
          </button>
        </div>
      </div>
      
      <ExperimentSelector
        onSelectExperiment={handleSelectExperiment}
        selectedExperimentId={selectedExperimentId}
      />
      
      {loanAccepted ? (
        <div className={styles.successMessage}>
          <h2>Congratulations on your new loan!</h2>
          <p>Your SoFi personal loan has been successfully accepted. Funds will be deposited into your account within 1-3 business days.</p>
          <button
            className={styles.continueButton}
            onClick={() => setLoanAccepted(false)}
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className={styles.loanContainer}>
          <div className={styles.loanDetailsSection}>
            <h2>Your Loan Details</h2>
            <div className={styles.loanSummary}>
              <div className={styles.loanAmount}>
                <span className={styles.loanAmountValue}>${loanAmount.toLocaleString()}</span>
                <span className={styles.loanAmountLabel}>Loan Amount</span>
              </div>
              
              <div className={styles.loanTerms}>
                <div className={styles.loanTermItem}>
                  <span className={styles.loanTermValue}>{interestRate}%</span>
                  <span className={styles.loanTermLabel}>Interest Rate</span>
                </div>
                <div className={styles.loanTermItem}>
                  <span className={styles.loanTermValue}>{loanTerm} months</span>
                  <span className={styles.loanTermLabel}>Loan Term</span>
                </div>
                <div className={styles.loanTermItem}>
                  <span className={styles.loanTermValue}>${monthlyPayment}</span>
                  <span className={styles.loanTermLabel}>Monthly Payment</span>
                </div>
              </div>
            </div>
            
            <div className={styles.loanBenefits}>
              <h3>SoFi Member Benefits</h3>
              <ul>
                <li>No origination fees</li>
                <li>No prepayment penalties</li>
                <li>Unemployment protection</li>
                <li>Career coaching</li>
                <li>Financial advising</li>
              </ul>
            </div>
          </div>
          
          <div className={styles.acceptanceSection}>
            <h2>Accept Your Loan</h2>
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" defaultValue="John Smith" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" defaultValue="john.smith@example.com" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="accountNumber">Bank Account Number</label>
              <input type="text" id="accountNumber" defaultValue="12345678" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="routingNumber">Routing Number</label>
              <input type="text" id="routingNumber" defaultValue="987654321" />
            </div>
            
            <div className={styles.termsAgreement}>
              <input type="checkbox" id="termsAgreement" defaultChecked={true} />
              <label htmlFor="termsAgreement">
                I have read and agree to the <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a>
              </label>
            </div>
            
            <div className={styles.formNote}>
              <p><strong>Note:</strong> This form is pre-populated for demonstration purposes.</p>
            </div>
            
            {/* Experiment Variant */}
            {selectedExperimentId ? (
              <ExperimentVariant
                experimentId={selectedExperimentId}
                userId={userId}
                sessionId={sessionId}
                variants={{
                  // Dynamically generate variants based on the selected experiment
                  ...(selectedExperiment?.variants || []).reduce((acc: Record<string, React.ReactNode>, variant) => ({
                    ...acc,
                    [variant.id]: (
                      <button
                        className={styles.acceptButton}
                        style={{
                          backgroundColor: variant.config.buttonColor || '#2dcccd'
                        }}
                        onClick={() => handleAcceptLoan(selectedExperimentId, variant.id)}
                      >
                        Accept Loan Offer
                      </button>
                    )
                  }), {})
                }}
                fallback={
                  <button
                    className={styles.acceptButton}
                    style={{ backgroundColor: getButtonColor() }}
                    onClick={() => {
                      if (assignedVariant) {
                        handleAcceptLoan(
                          selectedExperimentId,
                          assignedVariant.variantId
                        );
                      } else {
                        setLoanAccepted(true);
                      }
                    }}
                  >
                    Accept Loan Offer
                  </button>
                }
              />
            ) : (
              <button
                className={styles.acceptButton}
                style={{ backgroundColor: '#2dcccd' }}
                onClick={() => setLoanAccepted(true)}
                disabled={!selectedExperimentId}
              >
                Accept Loan Offer
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.experimentInfo}>
        <h3>About This Experiment</h3>
        <p>
          This page demonstrates an A/B test for the loan acceptance button color. Different users will see different button colors,
          and we track which color leads to more loan acceptances.
        </p>
        <p>
          Current experiment status:
          {assignedVariant ? (
            <span className={styles.experimentActive}>
              Active - You're seeing variant: {assignedVariant.variantId}
            </span>
          ) : (
            <span className={styles.experimentInactive}>
              {selectedExperimentId ? 'Waiting for assignment...' : 'No experiment selected'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}