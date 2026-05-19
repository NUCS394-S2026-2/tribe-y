import React from 'react';

import styles from './CtaSection.module.css';

export default function CtaSection() {
  return (
    <section className={styles.section} id="enterprise">
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.headline}>
            Ready to quantify your technical acquisition?
          </h2>
          <p className={styles.description}>
            Compass AI provides the technical clarity needed for confident
            decision-making. Schedule a briefing with our strategic code auditors.
          </p>
          <button className={styles.button}>
            Connect with Sales Agent
            <span className="material-symbols-outlined">handshake</span>
          </button>
        </div>
      </div>
    </section>
  );
}
