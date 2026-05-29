import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Footer from '../footer/Footer';
import TopNavBar from '../top-nav-bar/TopNavBar';
import styles from './RiskMetricsPage.module.css';

const ADJUSTMENTS = [
  {
    rating: '9–10',
    label: 'Premium Quality',
    adjustment: '+2–5% to deal value',
    color: 'green',
  },
  { rating: '7–8', label: 'Acceptable', adjustment: 'No adjustment', color: 'neutral' },
  {
    rating: '5–6',
    label: 'Below Standard',
    adjustment: '−3–8% or escrow clause',
    color: 'yellow',
  },
  {
    rating: '3–4',
    label: 'Significant Risk',
    adjustment: '−10–20% or renegotiation',
    color: 'orange',
  },
  {
    rating: '0–2',
    label: 'Critical Defects',
    adjustment: 'Deal pause or walk-away',
    color: 'red',
  },
];

const METRICS = [
  {
    id: 'resource-safety',
    label: 'Resource Safety',
    score: '0–10',
    description:
      'Evaluates ownership semantics, RAII compliance, use of raw pointers versus smart pointers, manual memory management, and undefined behavior patterns such as dangling references, use-after-free, and double-frees. Also flags unbounded allocations and missing destructor cleanup.',
    financialImpact:
      'Memory safety issues account for ~70% of critical CVEs in C++ codebases (Microsoft Security Response Center). High raw-pointer density signals ongoing maintenance liability and latent breach exposure that acquirers must price into the deal.',
  },
  {
    id: 'exception-safety',
    label: 'Exception Safety',
    score: '0–10',
    description:
      'Assesses exception safety guarantees (no-throw, strong, basic), error propagation patterns, resource cleanup in error paths, and silent failure modes. Checks for missing noexcept annotations on move constructors and destructors, and for catch blocks that swallow exceptions without logging.',
    financialImpact:
      'Poor exception handling is the leading cause of production outages in acquired systems. Downtime costs for enterprise software average $5,600/minute (Gartner). Latent exception unsafety often surfaces only under production load post-acquisition.',
  },
  {
    id: 'interface-design',
    label: 'Interface Design',
    score: '0–10',
    description:
      'Rates API clarity and defensive design: const-correctness, appropriate use of explicit constructors, parameter ordering and naming, encapsulation, precondition documentation, and absence of implicit narrowing conversions or silent truncation at public boundaries.',
    financialImpact:
      'Weak interface design multiplies integration cost for the acquiring team. Every ambiguous API boundary discovered post-close adds engineering rework — typically priced at 2–4× the cost of a pre-deal remediation sprint.',
  },
  {
    id: 'idiomatic-cpp',
    label: 'Idiomatic C++',
    score: '0–10',
    description:
      'Measures alignment with modern C++ best practices (C++14–C++23): range-based loops, structured bindings, STL algorithm usage versus manual loops, Rule of Zero compliance, and avoidance of C-style casts, raw arrays, and deprecated patterns.',
    financialImpact:
      'Codebases stuck on C++03/C++11 idioms carry a ramp-up premium for new engineers and a higher defect rate. Acquirers increasingly treat idiomatic modernity as a proxy for team discipline — and discount accordingly when it is absent.',
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
              Compass AI translates C++ code quality into four measurable dimensions —
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
            <h2 className={styles.sectionTitle}>Deal Value Adjustment Framework</h2>
            <p className={styles.sectionSubtitle}>
              How Compass AI scores translate to standard M&amp;A deal adjustments:
            </p>
            <div className={styles.adjustmentTable}>
              {ADJUSTMENTS.map((a) => (
                <div
                  key={a.rating}
                  className={`${styles.adjustmentRow} ${styles[`row_${a.color}`]}`}
                >
                  <span className={styles.adjustmentRating}>{a.rating}</span>
                  <span className={styles.adjustmentLabel}>{a.label}</span>
                  <span className={styles.adjustmentValue}>{a.adjustment}</span>
                </div>
              ))}
            </div>
            <p className={styles.disclaimer}>
              Adjustments are illustrative estimates based on industry benchmarks. Actual
              deal terms depend on deal structure, market conditions, and legal counsel.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Overall Score Calculation</h2>
            <div className={styles.formula}>
              <div className={styles.formulaRow}>
                <span className={styles.formulaLabel}>Overall Score</span>
                <span className={styles.formulaEq}>=</span>
                <span className={styles.formulaExpr}>
                  (Resource Safety × 0.35) + (Exception Safety × 0.30) + (Interface Design
                  × 0.20) + (Idiomatic C++ × 0.15)
                </span>
              </div>
              <p className={styles.formulaNote}>
                Weights are adjusted for domain-specific reports. Safety-critical domains
                (automotive, aerospace, medical) shift more weight toward Resource Safety
                and Exception Safety; general-purpose and startup reports weight Interface
                Design and Idiomatic C++ more heavily.
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
