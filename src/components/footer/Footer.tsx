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
          <span className={styles.link}>Privacy Policy</span>
          <span className={styles.link}>Terms of Service</span>
          <span className={styles.link}>X.402 Technical Standard</span>
          <span className={`${styles.link} ${styles.highlight}`}>
            Security Whitepaper
          </span>
        </div>
      </div>
    </footer>
  );
}
