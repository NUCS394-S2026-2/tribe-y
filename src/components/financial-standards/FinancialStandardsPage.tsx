import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Footer from '../footer/Footer';
import TopNavBar from '../top-nav-bar/TopNavBar';
import styles from './FinancialStandardsPage.module.css';

const STANDARDS = [
  {
    id: 'iso25010',
    name: 'ISO/IEC 25010',
    category: 'Software Quality',
    description:
      'The international standard for software product quality. Defines eight quality characteristics — functional suitability, reliability, performance efficiency, usability, security, compatibility, maintainability, and portability — each mapped to sub-characteristics with measurable metrics.',
    relevance:
      'Compass AI scores align to the ISO 25010 maintainability and security characteristics. Acquirers can benchmark a target codebase against ISO thresholds to justify deal price adjustments.',
  },
  {
    id: 'owasp',
    name: 'OWASP Top 10 (C/C++)',
    category: 'Security',
    description:
      "The Open Web Application Security Project's definitive list of critical security risks, adapted for systems-language codebases. Covers injection flaws, memory corruption, insecure deserialization, broken access control, and cryptographic failures.",
    relevance:
      'All Compass AI security audits check for OWASP Top 10 patterns. Findings are tagged with the applicable OWASP category so acquirers can communicate risk in a framework legal and finance teams recognize.',
  },
  {
    id: 'cert',
    name: 'CERT C++ Coding Standard',
    category: 'Safety & Security',
    description:
      "Carnegie Mellon's SEI CERT C++ Coding Standard provides 100+ rules covering memory management, integer overflow, concurrency, and error handling. Each rule is assigned a severity and remediation priority.",
    relevance:
      'CERT compliance is often contractually required in government, defense, and financial services software. A CERT gap analysis from Compass AI identifies which rules are violated and estimates remediation cost.',
  },
  {
    id: 'misra',
    name: 'MISRA C++ 2023',
    category: 'Safety-Critical',
    description:
      'Motor Industry Software Reliability Association guidelines for safety-critical C++ systems. Mandatory in automotive (ISO 26262), aerospace (DO-178C), and medical device (IEC 62443) software. Enforces strict subset of C++ with no undefined behavior.',
    relevance:
      "Acquiring a company with MISRA violations in safety-critical code creates post-acquisition liability. Compass AI's compliance report type maps every violation to its MISRA rule number and required fix.",
  },
  {
    id: 'cwe',
    name: 'CWE / CVE Mapping',
    category: 'Vulnerability Classification',
    description:
      'Common Weakness Enumeration and Common Vulnerabilities and Exposures provide a universal language for software weaknesses. Compass AI findings are tagged with CWE IDs where applicable, enabling direct lookup in the National Vulnerability Database.',
    relevance:
      'CWE tagging lets deal teams cross-reference findings against public exploit databases. A finding tagged CWE-119 (buffer overflow) with an associated CVE in a widely-used dependency triggers immediate due-diligence escalation.',
  },
];

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

export default function FinancialStandardsPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <TopNavBar onCtaClick={() => navigate('/chat')} />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.badge}>Financial Standards</div>
            <h1 className={styles.title}>
              Industry Standards in M&A Technical Due Diligence
            </h1>
            <p className={styles.subtitle}>
              Compass AI reports are grounded in recognized industry standards. Every
              finding references an applicable rule, guideline, or vulnerability
              classification — giving acquirers language that holds up in deal
              negotiations and post-closing indemnity disputes.
            </p>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Referenced Standards</h2>
            <div className={styles.standards}>
              {STANDARDS.map((s) => (
                <div key={s.id} className={styles.standard}>
                  <div className={styles.standardHeader}>
                    <span className={styles.standardName}>{s.name}</span>
                    <span className={styles.standardCategory}>{s.category}</span>
                  </div>
                  <p className={styles.standardDesc}>{s.description}</p>
                  <div className={styles.relevance}>
                    <span className={styles.relevanceLabel}>M&A relevance: </span>
                    {s.relevance}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Deal Value Adjustment Framework</h2>
            <p className={styles.sectionSubtitle}>
              How Compass AI scores translate to standard M&A deal adjustments:
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
            <h2 className={styles.sectionTitle}>Why This Matters for Acquirers</h2>
            <div className={styles.prose}>
              <p>
                Technical due diligence historically relied on ad-hoc code reviews by
                contractors with no standardized output format. The result: findings that
                couldn&apos;t be compared across deals, risk estimates that didn&apos;t
                survive legal review, and post-closing surprises that eroded deal value.
              </p>
              <p>
                Compass AI generates reports anchored to published, citable standards.
                When a finding references CERT Rule MEM50-CPP or OWASP A05:2021, both
                technical and non-technical stakeholders can look up the standard
                independently — making the risk assessment defensible and repeatable.
              </p>
            </div>
          </section>

          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>Run a standards-aligned audit</h2>
            <p className={styles.ctaText}>
              Select a report type and let Compass AI map your codebase to the relevant
              standard.
            </p>
            <Link to="/chat" className={styles.ctaButton}>
              Start Audit
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
