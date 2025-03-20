import { useState, useEffect } from 'react';
import { ExperimentApiClient } from '@sofi-application/experiment-api';
import { GetActiveExperimentsResponse } from '@sofi-application/shared';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

/**
 * Hook to retrieve experiment configuration for a user
 * This is a shared hook that can be used across different components
 */
export function useExperiment(userId: string, sessionId: string) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [experiments, setExperiments] = useState<GetActiveExperimentsResponse['experiments']>([]);

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiClient = new ExperimentApiClient(API_URL);
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

    if (userId && sessionId) {
      fetchExperiments();
    } else {
      setLoading(false);
      setExperiments([]);
    }
  }, [userId, sessionId]);

  /**
   * Get configuration for a specific experiment
   * @param experimentId The ID of the experiment to get configuration for
   * @returns The experiment configuration or null if not found
   */
  const getExperimentConfig = (experimentId: string) => {
    const experiment = experiments.find(exp => exp.experimentId === experimentId);
    return experiment ? experiment.config : null;
  };

  return {
    loading,
    error,
    experiments,
    getExperimentConfig,
  };
}