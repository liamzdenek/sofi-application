import React, { useState } from 'react';
import { ExperimentApiClient } from '@sofi-application/shared';
import styles from './CreateExperimentForm.module.css';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.VITE_EXPERIMENTATION_API_URL || process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

interface CreateExperimentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateExperimentForm({ onClose, onSuccess }: CreateExperimentFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetUserPercentage, setTargetUserPercentage] = useState(100);
  const [variants, setVariants] = useState([
    { name: 'Control', config: { buttonColor: 'blue' } },
    { name: 'Variant A', config: { buttonColor: 'green' } }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle adding a new variant
  const handleAddVariant = () => {
    setVariants([...variants, { name: `Variant ${variants.length}`, config: { buttonColor: 'blue' } }]);
  };

  // Handle removing a variant
  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 2) {
      setError('You need at least two variants for an experiment');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Handle updating a variant
  const handleVariantChange = (index: number, field: 'name' | 'config', value: any) => {
    const updatedVariants = [...variants];
    if (field === 'name') {
      updatedVariants[index].name = value;
    } else if (field === 'config') {
      try {
        // If value is a string, try to parse it as JSON
        if (typeof value === 'string') {
          updatedVariants[index].config = JSON.parse(value);
        } else {
          updatedVariants[index].config = value;
        }
      } catch (err) {
        setError('Invalid JSON for variant configuration');
        return;
      }
    }
    setVariants(updatedVariants);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!name.trim()) {
      setError('Experiment name is required');
      return;
    }

    if (!description.trim()) {
      setError('Experiment description is required');
      return;
    }

    if (targetUserPercentage < 1 || targetUserPercentage > 100) {
      setError('Target user percentage must be between 1 and 100');
      return;
    }

    if (variants.length < 2) {
      setError('You need at least two variants for an experiment');
      return;
    }

    // Check for duplicate variant names
    const variantNames = variants.map(v => v.name);
    if (new Set(variantNames).size !== variantNames.length) {
      setError('Variant names must be unique');
      return;
    }

    try {
      setIsSubmitting(true);
      const apiClient = new ExperimentApiClient(API_URL);
      await apiClient.createExperiment({
        name,
        description,
        variants: variants.map(({ name, config }) => ({ name, config })),
        targetUserPercentage,
      });

      onSuccess();
    } catch (err) {
      console.error('Error creating experiment:', err);
      setError('Failed to create experiment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>Create New Experiment</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Experiment Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Button Color Test"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this experiment"
            rows={3}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="targetUserPercentage">Target User Percentage</label>
          <input
            type="number"
            id="targetUserPercentage"
            value={targetUserPercentage}
            onChange={(e) => setTargetUserPercentage(Number(e.target.value))}
            min="1"
            max="100"
            required
          />
          <span className={styles.inputHelp}>Percentage of users who will be included in this experiment (1-100)</span>
        </div>
        
        <div className={styles.variantsSection}>
          <h3>Variants</h3>
          <p className={styles.variantsHelp}>Define at least two variants for your experiment</p>
          
          {variants.map((variant, index) => (
            <div key={index} className={styles.variantCard}>
              <div className={styles.variantHeader}>
                <h4>Variant {index + 1}</h4>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveVariant(index)}
                  disabled={variants.length <= 2}
                >
                  Remove
                </button>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor={`variant-${index}-name`}>Name</label>
                <input
                  type="text"
                  id={`variant-${index}-name`}
                  value={variant.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  placeholder="e.g., Control, Treatment"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor={`variant-${index}-config`}>Configuration (JSON)</label>
                <textarea
                  id={`variant-${index}-config`}
                  value={JSON.stringify(variant.config, null, 2)}
                  onChange={(e) => handleVariantChange(index, 'config', e.target.value)}
                  placeholder='{"buttonColor": "blue"}'
                  rows={4}
                  required
                />
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className={styles.addVariantButton}
            onClick={handleAddVariant}
          >
            Add Variant
          </button>
        </div>
        
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Experiment'}
          </button>
        </div>
      </form>
    </div>
  );
}