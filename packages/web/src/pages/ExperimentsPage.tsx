import React, { useState, useEffect, useCallback } from 'react';
import { ExperimentApiClient, Experiment } from '@sofi-application/shared';
import { CreateExperimentForm } from '../components/CreateExperimentForm';
import { LoadingScreen } from '../components/LoadingScreen';
import styles from './ExperimentsPage.module.css';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.VITE_EXPERIMENTATION_API_URL || process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

export function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Create a reusable function to fetch experiments
  const fetchExperiments = useCallback(async () => {
    try {
      setLoading(true);
      const apiClient = new ExperimentApiClient(API_URL);
      const response = await apiClient.listExperiments();
      setExperiments(response.experiments);
      setError(null);
    } catch (err) {
      console.error('Error fetching experiments:', err);
      setError('Failed to load experiments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch experiments on component mount
  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  // Function to handle experiment status change
  const handleStatusChange = async (experimentId: string, newStatus: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED') => {
    try {
      const apiClient = new ExperimentApiClient(API_URL);
      await apiClient.updateExperiment({
        id: experimentId,
        status: newStatus,
      });

      // Update the local state
      setExperiments(prevExperiments =>
        prevExperiments.map(exp =>
          exp.id === experimentId ? { ...exp, status: newStatus } : exp
        )
      );

      // Update selected experiment if it's the one being modified
      if (selectedExperiment && selectedExperiment.id === experimentId) {
        setSelectedExperiment(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating experiment status:', err);
      setError('Failed to update experiment status. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Experiments</h1>
        <button 
          className={styles.createButton}
          onClick={() => setIsCreating(true)}
        >
          Create New Experiment
        </button>
      </div>

      {loading ? (
        <LoadingScreen message="Loading experiments..." />
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.experimentsList}>
            {experiments.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No experiments found. Create your first experiment to get started.</p>
              </div>
            ) : (
              <table className={styles.experimentsTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Variants</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.map(experiment => (
                    <tr 
                      key={experiment.id} 
                      className={selectedExperiment?.id === experiment.id ? styles.selectedRow : ''}
                      onClick={() => setSelectedExperiment(experiment)}
                    >
                      <td>{experiment.name}</td>
                      <td>
                        <span className={`${styles.status} ${styles[experiment.status.toLowerCase()]}`}>
                          {experiment.status}
                        </span>
                      </td>
                      <td>{experiment.variants.length}</td>
                      <td>{new Date(experiment.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions}>
                          {experiment.status === 'DRAFT' && (
                            <button 
                              className={styles.actionButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(experiment.id, 'ACTIVE');
                              }}
                            >
                              Activate
                            </button>
                          )}
                          {experiment.status === 'ACTIVE' && (
                            <button 
                              className={styles.actionButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(experiment.id, 'PAUSED');
                              }}
                            >
                              Pause
                            </button>
                          )}
                          {experiment.status === 'PAUSED' && (
                            <button 
                              className={styles.actionButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(experiment.id, 'ACTIVE');
                              }}
                            >
                              Resume
                            </button>
                          )}
                          {(experiment.status === 'ACTIVE' || experiment.status === 'PAUSED') && (
                            <button 
                              className={styles.actionButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(experiment.id, 'COMPLETED');
                              }}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedExperiment && (
            <div className={styles.experimentDetail}>
              <h2>{selectedExperiment.name}</h2>
              <p className={styles.description}>{selectedExperiment.description}</p>
              
              <div className={styles.detailSection}>
                <h3>Status</h3>
                <p>
                  <span className={`${styles.status} ${styles[selectedExperiment.status.toLowerCase()]}`}>
                    {selectedExperiment.status}
                  </span>
                </p>
              </div>
              
              <div className={styles.detailSection}>
                <h3>Target User Percentage</h3>
                <p>{selectedExperiment.targetUserPercentage}%</p>
              </div>
              
              <div className={styles.detailSection}>
                <h3>Variants</h3>
                <div className={styles.variantsGrid}>
                  {selectedExperiment.variants.map(variant => (
                    <div key={variant.id} className={styles.variantCard}>
                      <h4>{variant.name}</h4>
                      <pre className={styles.configCode}>
                        {JSON.stringify(variant.config, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.detailSection}>
                <h3>Dates</h3>
                <p>Created: {new Date(selectedExperiment.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedExperiment.updatedAt).toLocaleString()}</p>
                {selectedExperiment.startDate && (
                  <p>Start Date: {new Date(selectedExperiment.startDate).toLocaleString()}</p>
                )}
                {selectedExperiment.endDate && (
                  <p>End Date: {new Date(selectedExperiment.endDate).toLocaleString()}</p>
                )}
              </div>
              
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedExperiment(null)}
              >
                Close Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create experiment modal */}
      {isCreating && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <CreateExperimentForm
              onClose={() => setIsCreating(false)}
              onSuccess={() => {
                setIsCreating(false);
                fetchExperiments();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}