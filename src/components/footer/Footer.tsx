import React from 'react';

import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandGroup}>
          <span className={styles.brandName}>Compass AI</span>
          <span className={styles.copyright}>
            © 2026 Compass AI. High-Precision Code Audits for Strategic M&A.
          </span>
        </div>
        <div className={styles.linksGroup}>
          <a href="#privacy" className={styles.link}>
            Privacy Policy
          </a>
          <a href="#terms" className={styles.link}>
            Terms of Service
          </a>
          <a href="#standard" className={styles.link}>
            X.402 Technical Standard
          </a>
          <a href="#whitepaper" className={`${styles.link} ${styles.highlight}`}>
            Security Whitepaper
          </a>
        </div>
      </div>
    </footer>
  );
}
