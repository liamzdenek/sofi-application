import React, { ReactNode, useCallback } from 'react';
import { useExperiment } from '../hooks/useExperiment';
import { useExperimentEvent } from '../hooks/useExperimentEvent';

interface ExperimentEventTrackerProps {
  experimentId: string;
  userId: string;
  sessionId: string;
  children: (trackEvent: (action: string, metadata?: Record<string, any>) => void) => ReactNode;
}

/**
 * A component that provides a function to track events for a specific experiment
 * This is a shared component that can be used across different parts of the application
 */
export function ExperimentEventTracker({
  experimentId,
  userId,
  sessionId,
  children,
}: ExperimentEventTrackerProps) {
  const { experiments } = useExperiment(userId, sessionId);
  const { recordEvent } = useExperimentEvent(userId, sessionId);

  // Find the experiment in the list of active experiments
  const experiment = experiments.find(exp => exp.experimentId === experimentId);

  // Create a function to track events for this experiment
  const trackEvent = useCallback(
    (action: string, metadata?: Record<string, any>) => {
      if (experiment) {
        recordEvent(experimentId, experiment.variantId, action, metadata);
      }
    },
    [experiment, experimentId, recordEvent]
  );

  // Render the children with the trackEvent function
  return <>{children(trackEvent)}</>;
}

/**
 * A higher-order component that wraps a component with experiment event tracking
 * @param Component The component to wrap
 * @param experimentId The ID of the experiment
 * @returns A wrapped component with experiment event tracking
 */
export function withExperimentEventTracking<P extends { trackEvent?: (action: string, metadata?: Record<string, any>) => void }>(
  Component: React.ComponentType<P>,
  experimentId: string
) {
  return function WithExperimentEventTracking(props: Omit<P, 'trackEvent'> & { userId: string; sessionId: string }) {
    const { userId, sessionId, ...rest } = props as any;

    return (
      <ExperimentEventTracker
        experimentId={experimentId}
        userId={userId}
        sessionId={sessionId}
      >
        {(trackEvent) => <Component {...rest as P} trackEvent={trackEvent} />}
      </ExperimentEventTracker>
    );
  };
}