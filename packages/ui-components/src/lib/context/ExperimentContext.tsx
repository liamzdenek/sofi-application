import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ExperimentApiClient } from '@sofi-application/experiment-api';
import { GetActiveExperimentsResponse } from '@sofi-application/shared';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

interface ExperimentContextType {
  loading: boolean;
  error: Error | null;
  experiments: GetActiveExperimentsResponse['experiments'];
  getExperimentConfig: (experimentId: string) => Record<string, any> | null;
  recordEvent: (experimentId: string, variantId: string, action: string, metadata?: Record<string, any>) => Promise<boolean>;
  refreshExperiments: () => Promise<void>;
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined);

interface ExperimentProviderProps {
  children: ReactNode;
  userId: string;
  sessionId: string;
}

/**
 * Provider component for experiment data
 * This makes experiment data and functions available throughout the component tree
 */
export function ExperimentProvider({ children, userId, sessionId }: ExperimentProviderProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [experiments, setExperiments] = useState<GetActiveExperimentsResponse['experiments']>([]);
  const apiClient = new ExperimentApiClient(API_URL);

  // Fetch experiments when the component mounts or when userId/sessionId changes
  const fetchExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getActiveExperiments({
        userId,
        sessionId,
      });
      
      setExperiments(response.experiments);
    } catch (err) {
      console.error('Error fetching experiments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch experiments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && sessionId) {
      fetchExperiments();
    } else {
      setLoading(false);
      setExperiments([]);
    }
  }, [userId, sessionId]);

  // Get configuration for a specific experiment
  const getExperimentConfig = (experimentId: string) => {
    const experiment = experiments.find(exp => exp.experimentId === experimentId);
    return experiment ? experiment.config : null;
  };

  // Record an experiment event
  const recordEvent = async (
    experimentId: string,
    variantId: string,
    action: string,
    metadata?: Record<string, any>
  ) => {
    try {
      await apiClient.recordEvent({
        experimentId,
        variantId,
        userId,
        sessionId,
        action,
        metadata,
      });
      return true;
    } catch (error) {
      console.error('Error recording experiment event:', error);
      return false;
    }
  };

  // Refresh experiments data
  const refreshExperiments = async () => {
    await fetchExperiments();
  };

  const value: ExperimentContextType = {
    loading,
    error,
    experiments,
    getExperimentConfig,
    recordEvent,
    refreshExperiments,
  };

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
}

/**
 * Hook to use experiment context
 * @returns The experiment context
 * @throws Error if used outside of ExperimentProvider
 */
export function useExperimentContext() {
  const context = useContext(ExperimentContext);
  if (context === undefined) {
    throw new Error('useExperimentContext must be used within an ExperimentProvider');
  }
  return context;
}