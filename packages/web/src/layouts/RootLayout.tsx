import React from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import { ExperimentProvider } from '@sofi-application/ui-components';
import styles from './RootLayout.module.css';

export function RootLayout() {
  // For demo purposes, we'll use a fixed user ID and session ID
  const userId = 'user-123';
  const sessionId = 'session-456';

  return (
    <ExperimentProvider userId={userId} sessionId={sessionId}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Experimentation Platform</h1>
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
              Home
            </Link>
            <Link to="/experiments" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
              Experiments
            </Link>
            <Link to="/reports" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
              Reports
            </Link>
            <Link to="/sample" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
              Sample Page
            </Link>
          </nav>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
        <footer className={styles.footer}>
          <p>© 2025 Experimentation Platform Accelerator</p>
        </footer>
      </div>
    </ExperimentProvider>
  );
}