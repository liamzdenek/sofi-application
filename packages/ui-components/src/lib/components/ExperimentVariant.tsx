import React, { ReactNode } from 'react';
import { useExperiment } from '../hooks/useExperiment';
import { useExperimentEvent } from '../hooks/useExperimentEvent';

interface ExperimentVariantProps {
  experimentId: string;
  userId: string;
  sessionId: string;
  variants: {
    [variantId: string]: ReactNode;
  };
  fallback?: ReactNode;
  recordView?: boolean;
}

/**
 * A component that displays the appropriate variant for an experiment
 * This is a shared component that can be used across different parts of the application
 */
export function ExperimentVariant({
  experimentId,
  userId,
  sessionId,
  variants,
  fallback = null,
  recordView = true,
}: ExperimentVariantProps) {
  const { loading, error, experiments } = useExperiment(userId, sessionId);
  const { recordEvent } = useExperimentEvent(userId, sessionId);

  // Find the experiment in the list of active experiments
  const experiment = experiments.find(exp => exp.experimentId === experimentId);

  // Record a view event when the component mounts
  React.useEffect(() => {
    if (experiment && recordView) {
      recordEvent(experimentId, experiment.variantId, 'VARIANT_VIEW');
    }
  }, [experiment, experimentId, recordEvent, recordView]);

  if (loading) {
    // You could return a loading state here, but for experiments
    // it's often better to just show the fallback immediately
    return <>{fallback}</>;
  }

  if (error || !experiment) {
    return <>{fallback}</>;
  }

  // Get the variant content for the assigned variant
  const variantContent = variants[experiment.variantId];

  // If the variant doesn't exist in the provided variants, show the fallback
  if (!variantContent) {
    return <>{fallback}</>;
  }

  return <>{variantContent}</>;
}