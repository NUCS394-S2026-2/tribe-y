import React from 'react';

import styles from './ReportCard.module.css';
import type { ReportCardData } from './reportCardData';

const DEFAULT_REPORT_CARD: ReportCardData = {
  subject: 'nexus-core-api',
  auditId: 'AUDIT_LOG_ID: 9942-XJ',
  environmentLabel: 'Live Execution Environment',
  healthScore: 62,
  alert:
    '> DEBT_ALARM: High risk detected in critical path. Audit recommended before deal close.',
  issues: [
    {
      title: 'Circular dependency',
      detail: 'Package core/v1 imports auth/v2 and vice-versa.',
    },
    {
      title: 'Insecure credentials',
      detail: 'Hardcoded secret detected in config/production.yaml.',
    },
  ],
};

interface ReportCardProps {
  data?: ReportCardData;
}

export default function ReportCard({ data = DEFAULT_REPORT_CARD }: ReportCardProps) {
  return (
    <section className={styles.section} id="metrics">
      <div className={styles.container}>
        <div className={styles.layout}>
          <div className={styles.textColumn}>
            <span className={styles.sectionLabel}>Section 04 // Output</span>
            <h2 className={styles.headline}>The Report Card</h2>
            <p className={styles.description}>
              Our proprietary reporting interface provides immediate clarity. We distill
              millions of lines of code into high-fidelity actionable intelligence for
              investment partners.
            </p>
            <div className={styles.subjectBox}>
              <h4 className={styles.subjectLabel}>Selected Subject</h4>
              <div className={styles.subjectValue}>
                <div className={styles.subjectIcon}>
                  <span className="material-symbols-outlined text-sm">deployed_code</span>
                </div>
                <span>{data.subject}</span>
              </div>
            </div>
          </div>

          <div className={styles.uiColumn}>
            <div className={styles.reportWindow}>
              <div className={styles.windowHeader}>
                <div className={styles.dots}>
                  <span className={styles.dotError}></span>
                  <span className={styles.dotWarning}></span>
                  <span className={styles.dotSuccess}></span>
                  <span className={styles.logId}>{data.auditId}</span>
                </div>
                <div className={styles.envLabel}>{data.environmentLabel}</div>
              </div>

              <div className={styles.windowBody}>
                <div className={styles.metricsGrid}>
                  <div className={styles.healthMetric}>
                    <h5 className={styles.metricLabel}>Overall Health Rating</h5>
                    <div className={styles.scoreRow}>
                      <span className={styles.scoreValue}>{data.healthScore}</span>
                      <span className={styles.scoreTotal}>/ 100</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${data.healthScore}%` }}
                      ></div>
                    </div>
                    <p className={styles.metricAlert}>{data.alert}</p>
                  </div>

                  <div className={styles.smellMetric}>
                    <h5 className={styles.metricLabel}>Critical Smells</h5>
                    <ul className={styles.smellList}>
                      {data.issues.map((issue) => (
                        <li key={`${issue.title}-${issue.detail}`}>
                          <span
                            className={`material-symbols-outlined ${styles.errorIcon}`}
                          >
                            warning
                          </span>
                          <div>
                            <div className={styles.smellTitle}>{issue.title}</div>
                            <div className={styles.smellDetail}>{issue.detail}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
