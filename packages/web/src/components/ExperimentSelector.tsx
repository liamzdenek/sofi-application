import React, { useState, useEffect } from 'react';
import { ExperimentApiClient, Experiment } from '@sofi-application/shared';
import styles from './ExperimentSelector.module.css';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.VITE_EXPERIMENTATION_API_URL || process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

interface ExperimentSelectorProps {
  onSelectExperiment: (experimentId: string) => void;
  selectedExperimentId: string | null;
}

export function ExperimentSelector({ onSelectExperiment, selectedExperimentId }: ExperimentSelectorProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active experiments on component mount
  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setLoading(true);
        const apiClient = new ExperimentApiClient(API_URL);
        const response = await apiClient.listExperiments({ status: 'ACTIVE' });
        setExperiments(response.experiments);
        
        // If no experiment is selected and we have experiments, select the first one
        if (!selectedExperimentId && response.experiments.length > 0) {
          onSelectExperiment(response.experiments[0].id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching experiments:', err);
        setError('Failed to load experiments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExperiments();
  }, [onSelectExperiment, selectedExperimentId]);

  if (loading) {
    return <div className={styles.loading}>Loading experiments...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (experiments.length === 0) {
    return (
      <div className={styles.noExperiments}>
        <p>No active experiments found. Please create and activate an experiment first.</p>
        <a href="/experiments" className={styles.link}>Go to Experiments Page</a>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label htmlFor="experiment-selector" className={styles.label}>
        Select an experiment to run:
      </label>
      <select
        id="experiment-selector"
        className={styles.select}
        value={selectedExperimentId || ''}
        onChange={(e) => onSelectExperiment(e.target.value)}
      >
        <option value="" disabled>
          -- Select an experiment --
        </option>
        {experiments.map((experiment) => (
          <option key={experiment.id} value={experiment.id}>
            {experiment.name}
          </option>
        ))}
      </select>
      
      {selectedExperimentId && (
        <div className={styles.experimentDetails}>
          {experiments
            .filter((exp) => exp.id === selectedExperimentId)
            .map((experiment) => (
              <div key={experiment.id}>
                <h4>{experiment.name}</h4>
                <p className={styles.description}>{experiment.description}</p>
                <div className={styles.variants}>
                  <strong>Variants:</strong>
                  <ul>
                    {experiment.variants.map((variant) => (
                      <li key={variant.id}>
                        {variant.name}: {JSON.stringify(variant.config)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}