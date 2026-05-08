import React from 'react';

import styles from './HeroSection.module.css';

interface Props {
  onPrimaryClick?: () => void;
}

export default function HeroSection({ onPrimaryClick }: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.backgroundCode} aria-hidden="true">
        {`0x42 0x46 0x44 0x20 0x53 0x59 0x53 0x54 0x45 0x4d 0x20 0x41 0x43 0x54 0x49 0x56 0x45
ANALYSING_M_AND_A_FLOWS...
LOAD_X402_PROTOCOL... [SUCCESS]
SCANNING_CODEBASE_ROOT... 100%
DETECTING_TECHNICAL_DEBT...
SECURITY_VULNERABILITIES: FOUND(14)
COMPLIANCE_STATUS: ALERT
0x0012FA34 -> BUFFER_OVERFLOW_DETECTED
0x0012FA38 -> UNENCRYPTED_PRIVATE_KEY`}
      </div>

      <div className={styles.container}>
        <div className={styles.statusBadge}>
          <span className={styles.statusText}>Protocol X.402 Active</span>
        </div>

        <h1 className={styles.headline}>High-Precision Code Audits for Strategic M&A</h1>

        <p className={styles.subhead}>
          Automated technical due diligence for high-stakes transactions. Quantify risk,
          identify debt, and secure your investment with Compass AI.
        </p>

        <div className={styles.buttonGroup}>
          <button className={styles.primaryButton} onClick={onPrimaryClick}>
            Start Session with Sales Agent
          </button>
          <button className={styles.secondaryButton}>View Sample Audit</button>
        </div>
      </div>
    </section>
  );
}
