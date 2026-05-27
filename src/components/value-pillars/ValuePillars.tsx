import React from 'react';

import styles from './ValuePillars.module.css';

export default function ValuePillars() {
  return (
    <section className={styles.section} id="analysis">
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <span className="material-symbols-outlined">fact_check</span>
            </div>
            <h3 className={styles.title}>Audit-Ready Reviews</h3>
            <p className={styles.description}>
              Deep technical analysis for strategic transactions. Our AI engine processes
              entire repositories to surface structural integrity and long-term
              scalability issues.
            </p>
            <span className={styles.link}>
              Protocol details <span className="material-symbols-outlined">east</span>
            </span>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <span className="material-symbols-outlined">query_stats</span>
            </div>
            <h3 className={styles.title}>M&A Intelligence</h3>
            <p className={styles.description}>
              Quantifying technical debt and risk in codebases. We turn nebulous &quot;bad
              code&quot; into specific financial liability assessments ready for the
              boardroom.
            </p>
            <a href="#metrics" className={styles.link}>
              Risk metrics <span className="material-symbols-outlined">east</span>
            </a>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <span className="material-symbols-outlined">payments</span>
            </div>
            <h3 className={styles.title}>Micro-payment Protocol</h3>
            <p className={styles.description}>
              Utilizing X.402 for secure, per-token agent transactions. High-precision
              billing for high-precision auditing, ensuring complete transparency and cost
              control.
            </p>
            <span className={styles.link}>
              Financial standards <span className="material-symbols-outlined">east</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
