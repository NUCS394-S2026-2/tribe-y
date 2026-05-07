import React from 'react';

import styles from './TopNavBar.module.css';

export default function TopNavBar() {
  return (
    <header className={styles.header}>
      <div className={styles.navGroup}>
        <span className={styles.logo}>Compass AI</span>
        <nav className={styles.nav}>
          <a href="#analysis" className={styles.link}>
            Analysis
          </a>
          <a href="#protocol" className={`${styles.link} ${styles.active}`}>
            X.402 Protocol
          </a>
          <a href="#compliance" className={styles.link}>
            Compliance
          </a>
          <a href="#enterprise" className={styles.link}>
            Enterprise
          </a>
        </nav>
      </div>
      <button className={styles.ctaButton}>Connect Sales Agent</button>
    </header>
  );
}
