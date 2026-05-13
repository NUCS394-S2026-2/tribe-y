import React from 'react';
import { useNavigate } from 'react-router-dom';

import styles from './LandingPage.module.css';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <span className={styles.badge}>compass.tne.ai</span>
      <h1 className={styles.headline}>
        Expert <span className={styles.accent}>C++ Code Review</span>
        <br />
        Powered by AI. Paid by Crypto.
      </h1>
      <p className={styles.subheadline}>
        Get a premium, annotated code review from our C++ Expert agent. Pay only when
        you&apos;re convinced — via a testnet micro-transaction.
      </p>
      <button className={styles.cta} onClick={() => navigate('/chat')}>
        Start with Salesbot
      </button>

      <div className={styles.features} aria-label="Platform features">
        <div className={styles.featureCard}>
          <p className={styles.featureTitle}>Salesbot</p>
          <p className={styles.featureDesc}>
            AI gatekeeper verifies your problem is C++. No wasted time on unsupported
            languages.
          </p>
        </div>
        <div className={styles.featureCard}>
          <p className={styles.featureTitle}>Teaser Review</p>
          <p className={styles.featureDesc}>
            See a partial expert analysis before paying — proof the agent knows what
            it&apos;s talking about.
          </p>
        </div>
        <div className={styles.featureCard}>
          <p className={styles.featureTitle}>X.402 Payment</p>
          <p className={styles.featureDesc}>
            Testnet crypto micro-transaction unlocks the full annotated report instantly.
          </p>
        </div>
        <div className={styles.featureCard}>
          <p className={styles.featureTitle}>Vault Receipt</p>
          <p className={styles.featureDesc}>
            Secure, transparent receipt generated on every engagement. Downloadable PDF.
          </p>
        </div>
      </div>
    </main>
  );
}
