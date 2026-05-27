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
        <nav className={styles.nav}></nav>
      </div>
      <button className={styles.ctaButton} onClick={onCtaClick}>
        Connect Sales Agent
      </button>
    </header>
  );
}
