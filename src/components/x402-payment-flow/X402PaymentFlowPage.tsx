import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Footer from '../footer/Footer';
import TopNavBar from '../top-nav-bar/TopNavBar';
import styles from './X402PaymentFlowPage.module.css';

const STEPS = [
  {
    step: '01',
    title: 'Request Review',
    description:
      'The client submits a C++ snippet or repository link. Compass AI returns a free teaser — a partial analysis of the most critical issues found.',
  },
  {
    step: '02',
    title: 'HTTP 402 Gate',
    description:
      'When the client requests the full report, the server responds with HTTP 402 Payment Required. The response includes a signed payment intent: amount in lamports, recipient wallet, network, and a unique binding memo.',
  },
  {
    step: '03',
    title: 'On-Chain Settlement',
    description:
      'The client signs a Solana transaction transferring the quoted amount to the service wallet, embedding the intent memo in the transaction. The wallet broadcasts the transaction to Solana Devnet.',
  },
  {
    step: '04',
    title: 'Server Verification',
    description:
      'The client submits the transaction signature to the confirmation endpoint. The server fetches the finalized transaction via RPC, verifies the recipient, amount, payer, and memo, then marks the review as paid in Firestore.',
  },
  {
    step: '05',
    title: 'Report Delivery',
    description:
      'With payment confirmed, the full expert report is unlocked — a downloadable PDF with line-by-line findings, cited sources, and recommended fixes. A cryptographic vault receipt records proof of payment and report integrity.',
  },
];

const SPECS = [
  { label: 'Network', value: 'Solana Devnet (demo) / Mainnet-beta (production)' },
  { label: 'Currency', value: 'SOL (lamports)' },
  { label: 'Payment standard', value: 'HTTP 402 — X.402 micropayment protocol' },
  {
    label: 'Binding mechanism',
    value: 'Memo program instruction embedded in transaction',
  },
  { label: 'Verification commitment', value: 'finalized (32+ confirmations)' },
  {
    label: 'Idempotency',
    value: 'Server rejects duplicate signatures; repeat confirms return cached receipt',
  },
  {
    label: 'Receipt format',
    value: 'JSON — receipt ID, content hash, chain ID, expiry, download token',
  },
];

export default function ProtocolPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <TopNavBar onCtaClick={() => navigate('/chat')} />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.badge}>X.402 Payment Flow</div>
            <h1 className={styles.title}>X.402 Payment Flow</h1>
            <p className={styles.subtitle}>
              Compass AI uses the X.402 micropayment protocol — an HTTP 402-based
              financial standard for per-request monetization of AI agent services. Every
              payment is settled on-chain, verified server-side, and recorded in a
              tamper-evident vault receipt.
            </p>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment Flow</h2>
            <div className={styles.steps}>
              {STEPS.map((s) => (
                <div key={s.step} className={styles.step}>
                  <div className={styles.stepNumber}>{s.step}</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.stepDesc}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Technical Specifications</h2>
            <div className={styles.specTable}>
              {SPECS.map((s) => (
                <div key={s.label} className={styles.specRow}>
                  <span className={styles.specLabel}>{s.label}</span>
                  <span className={styles.specValue}>{s.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Why On-Chain Payments?</h2>
            <div className={styles.prose}>
              <p>
                Traditional API billing relies on centralized payment processors with
                multi-day settlement, chargebacks, and opaque fee structures. For AI
                agent-to-agent (A2A) transactions — where one agent pays another for
                specialized analysis — this model breaks down at scale.
              </p>
              <p>
                X.402 replaces the billing layer with a cryptographic proof: the client
                proves payment by submitting an on-chain transaction signature. The server
                independently verifies the transaction before releasing gated content. No
                chargebacks, no intermediary, no shared secrets.
              </p>
              <p>
                For M&A technical due diligence specifically, the on-chain receipt also
                serves as an audit trail: acquirers can prove when a review was
                commissioned, what codebase was analyzed, and that the report was
                generated by a verified expert agent — all without relying on a third
                party to attest to those facts.
              </p>
            </div>
          </section>

          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>See it in action</h2>
            <p className={styles.ctaText}>
              Start a chat session and walk through the full payment flow on Solana
              Devnet.
            </p>
            <Link to="/chat" className={styles.ctaButton}>
              Open Chat
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
