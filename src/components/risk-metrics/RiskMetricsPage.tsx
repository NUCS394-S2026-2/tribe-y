import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Footer from '../footer/Footer';
import TopNavBar from '../top-nav-bar/TopNavBar';
import styles from './RiskMetricsPage.module.css';

const METRICS = [
  {
    id: 'security',
    label: 'Security Vulnerability Index',
    score: '0–10',
    description:
      'Counts and weights known vulnerability patterns: buffer overflows, use-after-free, injection surfaces, hardcoded secrets, and unsafe API usage. Each finding is weighted by exploitability and blast radius.',
    financialImpact:
      'A single critical CVE in production code can cost $4.45M on average in breach remediation (IBM Cost of a Data Breach, 2024). Acquirers discount deal value proportionally to unpatched critical findings.',
  },
  {
    id: 'memory',
    label: 'Memory Safety Score',
    score: '0–10',
    description:
      'Evaluates use of raw pointers, manual memory management, RAII compliance, and undefined behavior patterns such as dangling references, uninitialized reads, and double-frees.',
    financialImpact:
      'Memory safety issues account for ~70% of critical CVEs in C++ codebases (Microsoft Security Response Center). High raw-pointer density signals ongoing maintenance cost and latent liability.',
  },
  {
    id: 'maintainability',
    label: 'Maintainability Index',
    score: '0–10',
    description:
      'Derived from cyclomatic complexity, code duplication ratio, function length distribution, and comment density. High complexity correlates directly with defect density and ramp-up time for new engineers.',
    financialImpact:
      'Every 1-point drop in maintainability index maps to an estimated 8–12% increase in annual engineering cost to keep the codebase stable post-acquisition.',
  },
  {
    id: 'reliability',
    label: 'Reliability & Error Handling',
    score: '0–10',
    description:
      'Assesses exception safety guarantees, error propagation patterns, division-by-zero guards, null checks, and resource cleanup in error paths. Also flags silent failure modes.',
    financialImpact:
      'Poor error handling is the leading cause of production outages in acquired systems. Downtime costs for enterprise software average $5,600/minute (Gartner).',
  },
  {
    id: 'compliance',
    label: 'Standards Compliance',
    score: '0–10',
    description:
      'Checks against MISRA C++, CERT C++, and AUTOSAR C++ guidelines depending on the selected report type. Flags deviations from the applicable standard with rule citations.',
    financialImpact:
      'Non-compliance blocks deployment in regulated industries (automotive, aerospace, medical). Retroactive remediation to meet a standard post-acquisition can cost 3–10× the original development effort.',
  },
];

export default function RiskMetricsPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <TopNavBar onCtaClick={() => navigate('/chat')} />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.badge}>Risk Metrics</div>
            <h1 className={styles.title}>How Compass AI Quantifies Technical Risk</h1>
            <p className={styles.subtitle}>
              Compass AI translates C++ code quality into five measurable dimensions —
              each scored 0–10 and mapped to a concrete financial liability estimate. The
              result is a boardroom-ready risk profile, not just a list of lint warnings.
            </p>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Scoring Dimensions</h2>
            <div className={styles.metrics}>
              {METRICS.map((m) => (
                <div key={m.id} className={styles.metric}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.metricRange}>{m.score}</span>
                  </div>
                  <p className={styles.metricDesc}>{m.description}</p>
                  <div className={styles.impact}>
                    <span className={styles.impactLabel}>Financial impact: </span>
                    {m.financialImpact}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Overall Score Calculation</h2>
            <div className={styles.formula}>
              <div className={styles.formulaRow}>
                <span className={styles.formulaLabel}>Overall Score</span>
                <span className={styles.formulaEq}>=</span>
                <span className={styles.formulaExpr}>
                  (Security × 0.30) + (Memory Safety × 0.25) + (Reliability × 0.20) +
                  (Maintainability × 0.15) + (Compliance × 0.10)
                </span>
              </div>
              <p className={styles.formulaNote}>
                Weights are adjusted for domain-specific reports. Aerospace and automotive
                reports weight compliance more heavily; startup and general reports weight
                maintainability higher.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Report Types</h2>
            <div className={styles.reportTypes}>
              {[
                {
                  type: 'Security Audit',
                  focus: 'Vulnerabilities, attack surfaces, unsafe APIs',
                },
                {
                  type: 'Compliance Review',
                  focus: 'MISRA C++, CERT C++, AUTOSAR guidelines',
                },
                {
                  type: 'Architecture Analysis',
                  focus: 'Coupling, cohesion, dependency cycles',
                },
                {
                  type: 'Performance Review',
                  focus: 'Algorithmic complexity, memory allocation patterns',
                },
                {
                  type: 'Maintainability Audit',
                  focus: 'Complexity, duplication, documentation coverage',
                },
                {
                  type: 'M&A Due Diligence',
                  focus: 'All dimensions — boardroom summary format',
                },
              ].map((r) => (
                <div key={r.type} className={styles.reportType}>
                  <span className={styles.reportTypeName}>{r.type}</span>
                  <span className={styles.reportTypeFocus}>{r.focus}</span>
                </div>
              ))}
            </div>
          </section>

          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>Get your codebase scored</h2>
            <p className={styles.ctaText}>
              Paste a C++ snippet and see your teaser score in under 30 seconds.
            </p>
            <Link to="/chat" className={styles.ctaButton}>
              Start Free Analysis
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
