import React from 'react';

import styles from './TopNavBar.module.css';

interface Props {
  onCtaClick?: () => void;
}

export default function TopNavBar({ onCtaClick }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.navGroup}>
        <span className={styles.logo}>Compass AI</span>
        <nav className={styles.nav}>
          <a href="#analysis" className={styles.link}>
            Analysis
          </a>
          <a href="#enterprise" className={styles.link}>
            Enterprise
          </a>
        </nav>
      </div>
      <button className={styles.ctaButton} onClick={onCtaClick}>
        Connect Consultant Agent
      </button>
    </header>
  );
}
