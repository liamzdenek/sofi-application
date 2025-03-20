import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to the Experimentation Platform</h1>
      <p className={styles.description}>
        This platform enables you to quickly set up and analyze A/B tests to make data-driven decisions.
      </p>

      <div className={styles.cardContainer}>
        <div className={styles.card}>
          <h2>Manage Experiments</h2>
          <p>Create, update, and manage your A/B tests.</p>
          <Link to="/experiments" className={styles.button}>
            Go to Experiments
          </Link>
        </div>

        <div className={styles.card}>
          <h2>View Reports</h2>
          <p>Analyze the results of your experiments.</p>
          <Link to="/reports" className={styles.button}>
            View Reports
          </Link>
        </div>

        <div className={styles.card}>
          <h2>Sample Page</h2>
          <p>See experiments in action on a sample checkout page.</p>
          <Link to="/sample" className={styles.button}>
            Try Sample Page
          </Link>
        </div>
      </div>

      <div className={styles.infoSection}>
        <h2>About the Platform</h2>
        <p>
          This experimentation platform accelerator demonstrates how to implement a lightweight but functional
          A/B testing system. It includes:
        </p>
        <ul>
          <li>Experiment management interface</li>
          <li>Event tracking for user interactions</li>
          <li>Report generation and visualization</li>
          <li>Sample implementation of experiments</li>
        </ul>
      </div>
    </div>
  );
}