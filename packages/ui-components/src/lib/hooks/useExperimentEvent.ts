import { useCallback } from 'react';
import { ExperimentApiClient } from '@sofi-application/experiment-api';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.VITE_EXPERIMENTATION_API_URL || process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

/**
 * Hook to record experiment events
 * This is a shared hook that can be used across different components
 */
export function useExperimentEvent(
  userId: string,
  sessionId: string
) {
  /**
   * Record an experiment event
   * @param experimentId The ID of the experiment
   * @param variantId The ID of the variant
   * @param action The action that occurred (e.g., 'PAGE_VIEW', 'BUTTON_CLICK', 'CONVERSION')
   * @param metadata Optional additional data about the event
   */
  const recordEvent = useCallback(
    async (
      experimentId: string,
      variantId: string,
      action: string,
      metadata?: Record<string, any>
    ) => {
      try {
        const apiClient = new ExperimentApiClient(API_URL);
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
    },
    [userId, sessionId]
  );

  /**
   * Record a batch of experiment events
   * @param events Array of events to record
   */
  const recordBatchEvents = useCallback(
    async (
      events: Array<{
        experimentId: string;
        variantId: string;
        action: string;
        metadata?: Record<string, any>;
      }>
    ) => {
      try {
        const apiClient = new ExperimentApiClient(API_URL);
        await apiClient.batchRecordEvents({
          events: events.map(event => ({
            experimentId: event.experimentId,
            variantId: event.variantId,
            userId,
            sessionId,
            action: event.action,
            metadata: event.metadata,
          })),
        });
        return true;
      } catch (error) {
        console.error('Error batch recording experiment events:', error);
        return false;
      }
    },
    [userId, sessionId]
  );

  return {
    recordEvent,
    recordBatchEvents,
  };
}