import React, { useState, useEffect } from 'react';
import { ExperimentApiClient, ReportMetadata, ReportData, Experiment } from '@sofi-application/shared';
import { LoadingScreen } from '../components/LoadingScreen';
import styles from './ReportsPage.module.css';

// Get the API URL from environment variables with a localhost default
const API_URL = process.env.VITE_EXPERIMENTATION_API_URL || process.env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000';

export function ReportsPage() {
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [experiments, setExperiments] = useState<Record<string, Experiment>>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');

  // Function to fetch reports and experiments data
  const fetchData = async () => {
    try {
      setLoading(true);
      const apiClient = new ExperimentApiClient(API_URL);
      
      // Fetch reports
      const reportsResponse = await apiClient.listReports({ status: 'COMPLETED' });
      setReports(reportsResponse.reports);
      
      // Fetch experiments
      const experimentsResponse = await apiClient.listExperiments();
      
      // Convert experiments array to a map for easier lookup
      const experimentsMap: Record<string, Experiment> = {};
      experimentsResponse.experiments.forEach(experiment => {
        experimentsMap[experiment.id] = experiment;
      });
      
      setExperiments(experimentsMap);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchData();
  };

  // Fetch reports and experiments on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch report data when a report is selected
  useEffect(() => {
    if (!selectedReport) {
      setReportData(null);
      return;
    }

    const fetchReportData = async () => {
      try {
        setLoading(true);
        const apiClient = new ExperimentApiClient(API_URL);
        const response = await apiClient.getReportData({ id: selectedReport });
        setReportData(response.reportData);
        setError(null);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data. Please try again later.');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedReport]);

  // Generate a new report
  const handleGenerateReport = async () => {
    if (!selectedExperiment) {
      setError('Please select an experiment to generate a report for.');
      return;
    }

    try {
      setGeneratingReport(true);
      const apiClient = new ExperimentApiClient(API_URL);
      await apiClient.generateReport({ experimentId: selectedExperiment });
      
      // Refresh the reports list
      await fetchData();
      
      setError(null);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again later.');
    } finally {
      setGeneratingReport(false);
      setSelectedExperiment('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Reports</h1>
        <div className={styles.generateReport}>
          <select
            value={selectedExperiment}
            onChange={(e) => setSelectedExperiment(e.target.value)}
            className={styles.experimentSelect}
            disabled={generatingReport}
          >
            <option value="">Select an experiment</option>
            {Object.values(experiments).map(experiment => (
              <option key={experiment.id} value={experiment.id}>
                {experiment.name}
              </option>
            ))}
          </select>
          <button
            className={styles.generateButton}
            onClick={handleGenerateReport}
            disabled={!selectedExperiment || generatingReport}
          >
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.reportsList}>
          <div className={styles.reportsHeader}>
            <h2>Available Reports</h2>
            <button
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {loading && !reportData ? (
            <LoadingScreen message="Loading reports..." />
          ) : reports.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No reports found. Generate a report to get started.</p>
            </div>
          ) : (
            <table className={styles.reportsTable}>
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Created</th>
                  <th>Events</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr 
                    key={report.id} 
                    className={selectedReport === report.id ? styles.selectedRow : ''}
                  >
                    <td>{experiments[report.experimentId]?.name || report.experimentId}</td>
                    <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td>{report.metrics?.totalEvents || 'N/A'}</td>
                    <td>
                      <button 
                        className={styles.viewButton}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.reportDetail}>
          {selectedReport ? (
            loading ? (
              <LoadingScreen message="Loading report data..." />
            ) : reportData ? (
              <div className={styles.reportContent}>
                <h2>{reportData.experimentName}</h2>
                <p className={styles.reportDate}>
                  Generated: {new Date(reportData.generatedAt).toLocaleString()}
                </p>
                
                <div className={styles.reportSection}>
                  <h3>Time Range</h3>
                  <p>
                    From: {new Date(reportData.timeRange.start).toLocaleString()}
                    <br />
                    To: {new Date(reportData.timeRange.end).toLocaleString()}
                  </p>
                </div>
                
                <div className={styles.reportSection}>
                  <h3>Overall Metrics</h3>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                      <div className={styles.metricValue}>{reportData.metrics.overall.totalUsers}</div>
                      <div className={styles.metricLabel}>Total Users</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricValue}>{reportData.metrics.overall.totalEvents}</div>
                      <div className={styles.metricLabel}>Total Events</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricValue}>{(reportData.metrics.overall.conversionRate * 100).toFixed(2)}%</div>
                      <div className={styles.metricLabel}>Conversion Rate</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.reportSection}>
                  <h3>Variant Performance</h3>
                  <table className={styles.variantsTable}>
                    <thead>
                      <tr>
                        <th>Variant</th>
                        <th>Users</th>
                        <th>Conversion Rate</th>
                        <th>Improvement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.metrics.byVariant).map(([variantId, data]) => {
                        // Find the variant name from the experiment
                        const experiment = experiments[reportData.experimentId];
                        const variantName = experiment?.variants.find(v => v.id === variantId)?.name || variantId;
                        
                        return (
                          <tr key={variantId}>
                            <td>{variantName}</td>
                            <td>{data.users}</td>
                            <td>{(data.conversionRate * 100).toFixed(2)}%</td>
                            <td>
                              {data.improvement !== undefined && data.improvement !== null ? (
                                <span className={data.improvement > 0 ? styles.positive : styles.negative}>
                                  {data.improvement > 0 ? '+' : ''}{data.improvement.toFixed(2)}%
                                </span>
                              ) : (
                                'Baseline'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <button 
                  className={styles.closeButton}
                  onClick={() => setSelectedReport(null)}
                >
                  Close Report
                </button>
              </div>
            ) : (
              <div className={styles.error}>Failed to load report data.</div>
            )
          ) : (
            <div className={styles.noReportSelected}>
              <p>Select a report to view its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}