import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Footer from '../footer/Footer';
import TopNavBar from '../top-nav-bar/TopNavBar';
import styles from './SampleAuditPage.module.css';

// ─── Data ────────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  {
    name: 'Resource Safety',
    score: 10,
    grade: 'A',
    desc: 'Exemplary use of std::unique_ptr for RAII. Zero chance of leaks or double-frees.',
  },
  {
    name: 'Exception Safety',
    score: 9,
    grade: 'A',
    desc: 'Correct use of exceptions for errors and safe construction, but move operations lack noexcept.',
  },
  {
    name: 'Interface Design',
    score: 6,
    grade: 'B−',
    desc: "The interface is safe but minimal and less flexible than a standard container's.",
  },
  {
    name: 'Idiomatic C++',
    score: 5,
    grade: 'C',
    desc: 'The code unnecessarily reinvents a standard container, which is a major design smell.',
  },
];

const SUBMITTED_CODE = `#include <iostream>
#include <memory>
#include <vector>
#include <string>

class DataBuffer {
public:
    explicit DataBuffer(std::size_t capacity)
        : data_(std::make_unique<int[]>(capacity)), capacity_(capacity), size_(0) {}

    bool push(int value) {
        if (size_ >= capacity_) return false;
        data_[size_++] = value;
        return true;
    }

    [[nodiscard]] int get(std::size_t index) const {
        if (index >= size_) throw std::out_of_range("index out of range");
        return data_[index];
    }

    [[nodiscard]] std::size_t size() const noexcept { return size_; }

private:
    std::unique_ptr<int[]> data_;
    std::size_t capacity_;
    std::size_t size_;
};

int main() {
    DataBuffer buf(10);
    for (int i = 0; i < 5; ++i) buf.push(i * 2);

    for (std::size_t i = 0; i < buf.size(); ++i) {
        std::cout << buf.get(i) << '\\n';
    }
}`;

type Severity = 'medium' | 'low';

interface Finding {
  severity: Severity;
  line: number;
  num: number;
  title: string;
  desc: string;
  evidence: string;
  impact: string;
  recommendation: string;
  fix: string;
  refs: string;
}

const FINDINGS: Finding[] = [
  {
    severity: 'medium',
    line: 6,
    num: 1,
    title: 'Unnecessary Reimplementation of a Standard Container (std::vector)',
    desc: "The DataBuffer class is a safe but limited reimplementation of a subset of std::vector's functionality. The standard library containers are heavily tested, optimized, and provide a rich, familiar interface. Reinventing them, as per C++ Core Guideline SL.con.1, is fragile. Any new feature (e.g., resizing, insertion, iteration) becomes a new opportunity for bugs that have already been solved and hardened in the standard implementation.",
    evidence: `class DataBuffer {
public:
    explicit DataBuffer(std::size_t capacity)
        : data_(std::make_unique<int[]>(capacity)), capacity_(capacity), size_(0) {}

    bool push(int value) { /*...*/ }
    [[nodiscard]] int get(std::size_t index) const { /*...*/ }
    // ...
};`,
    impact:
      "This approach leads to increased maintenance costs, a higher likelihood of subtle bugs if the class is extended, and missed performance opportunities from std::vector's allocator awareness, contiguous iterator guarantees, and move-semantic optimizations during reallocation.",
    recommendation:
      'Replace the entire DataBuffer class with std::vector<int>. Use std::vector::reserve to pre-allocate the desired capacity and std::vector::push_back to add elements. This simplifies the code, improves its robustness, and makes it more expressive to other C++ developers.',
    fix: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> buf;
    buf.reserve(10);

    for (int i = 0; i < 5; ++i) {
        buf.push_back(i * 2);
    }

    for (const auto& val : buf) {
        std::cout << val << '\\n';
    }
}`,
    refs: 'C++ Core Guidelines SL.con.1: Prefer using STL containers by default · C++ Core Guidelines C.1: Organize related data into structures · ISO C++ [containers.general]',
  },
  {
    severity: 'low',
    line: 6,
    num: 2,
    title: 'Move Operations Should Be Explicitly Declared and noexcept',
    desc: 'The class is movable due to its std::unique_ptr member but lacks explicit declarations for its move constructor and move assignment operator. While the compiler-generated versions will work correctly, explicitly defaulting them and marking them noexcept communicates intent and guarantees a non-throwing contract. This is critical for efficient use in data structures like std::vector, which uses move_if_noexcept for strong exception safety during reallocations.',
    evidence: `class DataBuffer { // No explicit special member functions
public:
    explicit DataBuffer(std::size_t capacity)
        : data_(std::make_unique<int[]>(capacity)), capacity_(capacity), size_(0) {}`,
    impact:
      'Without a noexcept move constructor, moving a DataBuffer instance (e.g., when a std::vector<DataBuffer> reallocates) may be less efficient. Standard containers perform compile-time checks for this property to select the optimal algorithm for relocating elements.',
    recommendation:
      'Follow the "Rule of Five" (Guideline C.21). Since the class has a custom destructor (implicitly, via unique_ptr), declare all five special member functions. Delete the copy operations to enforce unique ownership and explicitly default the move operations, marking them noexcept.',
    fix: `class DataBuffer {
public:
    explicit DataBuffer(std::size_t capacity)
        : data_(std::make_unique<int[]>(capacity)), capacity_(capacity), size_(0) {}

    // Rule of Five
    ~DataBuffer() = default;
    DataBuffer(const DataBuffer&) = delete;
    DataBuffer& operator=(const DataBuffer&) = delete;
    DataBuffer(DataBuffer&&) noexcept = default;
    DataBuffer& operator=(DataBuffer&&) noexcept = default;

    // ... rest of the class ...
};`,
    refs: 'C++ Core Guidelines C.21: If you define or =delete any default operation, define or =delete them all · C++ Core Guidelines C.66: Make move operations noexcept · CERT C++ OOP54-CPP: Explicitly default or delete special member functions',
  },
  {
    severity: 'low',
    line: 19,
    num: 3,
    title: 'Accessor Returns by Value, Precluding Modification and Causing Copies',
    desc: 'The get() method returns an int by value. For int, this is efficient and harmless. However, as a general pattern for a container-like type, this is flawed. It prevents in-place modification of elements and would force a potentially expensive copy if the buffer held larger types. A canonical container provides both const and non-const accessors returning references.',
    evidence: `[[nodiscard]] int get(std::size_t index) const {
    if (index >= size_) throw std::out_of_range("index out of range");
    return data_[index];
}`,
    impact:
      'For a buffer of a larger type T, every call to get() would create a temporary copy of an element, impacting performance. The interface is also incomplete — there is no way to modify an existing element in place (e.g., buf.get(2) = 42; is not possible).',
    recommendation:
      'Provide const and non-const overloads of an accessor — typically operator[] for unchecked access or at() for checked access — returning by reference (int& and const int&). This is the idiomatic interface for C++ containers.',
    fix: `// Checked access — both const and non-const overloads
[[nodiscard]] const int& at(std::size_t index) const {
    if (index >= size_) throw std::out_of_range("index out of range");
    return data_[index];
}

[[nodiscard]] int& at(std::size_t index) {
    if (index >= size_) throw std::out_of_range("index out of range");
    return data_[index];
}`,
    refs: 'C++ Core Guidelines F.16: For "in" parameters, pass cheaply-copied types by value and others by reference to const · C++ Core Guidelines C.131: Avoid trivial getters and setters',
  },
  {
    severity: 'low',
    line: 6,
    num: 4,
    title: 'Interface Lacks a capacity() Accessor',
    desc: "The class correctly stores the allocated capacity in the capacity_ member but provides no public method to query it. A caller has no way to know the buffer's limit without tracking it separately — redundant and error-prone. Standard containers like std::vector and std::string all expose a capacity() member for this purpose.",
    evidence: `class DataBuffer {
// ...
private:
    std::unique_ptr<int[]> data_;
    std::size_t capacity_; // Stored, but not exposed
    std::size_t size_;
};`,
    impact:
      'The API is incomplete. A client cannot write a loop that pre-checks available capacity before calling push(), because the current interface provides no way to observe that value. This can lead to inefficient or incorrect client code.',
    recommendation:
      'Add a public, const, noexcept, [[nodiscard]] accessor returning capacity_. This completes the logical interface for a fixed-size buffer.',
    fix: `// Inside DataBuffer public section:

[[nodiscard]] std::size_t size()     const noexcept { return size_; }
[[nodiscard]] std::size_t capacity() const noexcept { return capacity_; }`,
    refs: 'C++ Core Guidelines C.4: Make a function a member only if it needs direct access to the representation of a class',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 9) return '#22c55e';
  if (score >= 7) return '#22d3ee';
  if (score >= 5) return '#f59e0b';
  if (score >= 3) return '#f97316';
  return '#ef4444';
}

function NumberedCode({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <div className={styles.numberedCode}>
      {lines.map((line, i) => (
        <div key={i} className={styles.codeLine}>
          <span className={styles.lineNum}>{i + 1}</span>
          <span className={styles.lineContent}>{line || ' '}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SampleAuditPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <TopNavBar onCtaClick={() => navigate('/chat')} />

      <main className={styles.main}>
        {/* ── Report Banner ── */}
        <div className={styles.reportBanner}>
          <div className={styles.bannerInner}>
            <div className={styles.bannerBrand}>compass.tne.ai</div>
            <div className={styles.bannerMeta}>
              C++ EXPERT CODE REVIEW · SAMPLE REPORT
            </div>
            <h1 className={styles.reportTitle}>Memory Safety Audit</h1>
            <div className={styles.reportDate}>Generated 5/27/2026, 4:40:00 PM</div>
          </div>
        </div>

        <div className={styles.container}>
          {/* ── Executive Scorecard ── */}
          <section className={styles.section}>
            <h2 className={styles.scorecardLabel}>EXECUTIVE SCORECARD</h2>

            <div className={styles.scorecard}>
              {/* Big score box */}
              <div className={styles.scoreBigBox} style={{ borderColor: scoreColor(9) }}>
                <span className={styles.bigScore} style={{ color: scoreColor(9) }}>
                  9
                </span>
                <span className={styles.bigScoreDenom}>/ 10</span>
                <span className={styles.gradeLabel} style={{ color: scoreColor(9) }}>
                  GRADE A
                </span>
              </div>

              {/* Dimension table */}
              <div className={styles.dimTable}>
                <div className={styles.dimTableHeader}>
                  <span>DIMENSION</span>
                  <span className={styles.alignRight}>SCORE</span>
                  <span className={styles.alignRight}>GRADE</span>
                </div>
                {DIMENSIONS.map((d) => (
                  <div key={d.name} className={styles.dimRow}>
                    <div className={styles.dimRowMain}>
                      <span className={styles.dimName}>{d.name}</span>
                      <span
                        className={`${styles.dimScore} ${styles.alignRight}`}
                        style={{ color: scoreColor(d.score) }}
                      >
                        {d.score}/10
                      </span>
                      <span
                        className={`${styles.dimGrade} ${styles.alignRight}`}
                        style={{ color: scoreColor(d.score) }}
                      >
                        {d.grade}
                      </span>
                    </div>
                    <p className={styles.dimDesc}>{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity summary */}
            <div className={styles.severityRow}>
              <span className={`${styles.sevBadge} ${styles.sev_critical}`}>
                0 CRITICAL
              </span>
              <span className={`${styles.sevBadge} ${styles.sev_high}`}>0 HIGH</span>
              <span className={`${styles.sevBadge} ${styles.sev_medium}`}>1 MEDIUM</span>
              <span className={`${styles.sevBadge} ${styles.sev_low}`}>3 LOW</span>
            </div>
          </section>

          {/* ── Section 1: Executive Summary ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeadGroup}>
              <span className={styles.sectionNum}>SECTION 1</span>
              <h2 className={styles.sectionTitle}>Executive Summary</h2>
            </div>
            <hr className={styles.divider} />

            <p className={styles.prose}>
              This code is fundamentally sound from a memory safety perspective. It
              correctly uses <code className={styles.inlineCode}>std::unique_ptr</code> to
              manage dynamic memory, following the RAII principle designed to eliminate
              resource leaks. However, its principal flaw is the needless reimplementation
              of a fixed-capacity <code className={styles.inlineCode}>std::vector</code>{' '}
              (lines 6–28). This pattern introduces maintenance overhead and misses the
              performance optimizations and rich interface of the standard library
              containers. While the implementation itself is safe, choosing to build it at
              all creates risk where none need exist.
            </p>

            <h3 className={styles.subsectionTitle}>Scoring rationale</h3>
            <div className={styles.rationaleList}>
              {DIMENSIONS.map((d) => (
                <div key={d.name} className={styles.rationaleItem}>
                  <div className={styles.rationaleHeader}>
                    <span className={styles.rationaleName}>{d.name}</span>
                    <span
                      className={styles.rationaleScore}
                      style={{ color: scoreColor(d.score) }}
                    >
                      {d.score}/10
                    </span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${d.score * 10}%`,
                        backgroundColor: scoreColor(d.score),
                      }}
                    />
                  </div>
                  <p className={styles.rationaleDesc}>{d.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 2: Methodology ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeadGroup}>
              <span className={styles.sectionNum}>SECTION 2</span>
              <h2 className={styles.sectionTitle}>Methodology</h2>
            </div>
            <hr className={styles.divider} />

            <p className={styles.prose}>
              This sample report was produced by the compass.tne.ai C++ Expert Agent
              against the focus area defined by the chosen report type. The agent first
              triages the submitted snippet and selects a representative, review-worthy
              slice; it then performs a structured analysis against domain-specific rules
              and produces this scored report.
            </p>

            <h3 className={styles.subsectionTitle}>Slice selected for this sample</h3>
            <p className={styles.sliceInfo}>
              Lines 1–37 · Full submitted code reviewed end-to-end.
            </p>
            <NumberedCode code={SUBMITTED_CODE} />
          </section>

          {/* ── Section 3: Detailed Findings ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeadGroup}>
              <span className={styles.sectionNum}>SECTION 3</span>
              <h2 className={styles.sectionTitle}>Detailed Findings</h2>
            </div>
            <hr className={styles.divider} />

            <div className={styles.findings}>
              {FINDINGS.map((f) => (
                <div
                  key={f.num}
                  className={`${styles.finding} ${styles[`finding_${f.severity}`]}`}
                >
                  <div className={styles.findingMeta}>
                    <span className={`${styles.sevChip} ${styles[`chip_${f.severity}`]}`}>
                      {f.severity.toUpperCase()}
                    </span>
                    <span className={styles.findingLineRef}>· LINE {f.line}</span>
                  </div>

                  <h3 className={styles.findingTitle}>
                    {f.num}. {f.title}
                  </h3>
                  <p className={styles.findingDesc}>{f.desc}</p>

                  <p className={styles.subLabel}>EVIDENCE</p>
                  <pre className={styles.evidenceCode}>{f.evidence}</pre>

                  <p className={styles.subLabel}>IMPACT</p>
                  <p className={styles.findingDesc}>{f.impact}</p>

                  <p className={styles.subLabel}>RECOMMENDATION</p>
                  <p className={styles.findingDesc}>{f.recommendation}</p>

                  <p className={styles.subLabel}>SUGGESTED FIX</p>
                  <pre className={styles.evidenceCode}>{f.fix}</pre>

                  <p className={styles.findingRefs}>References: {f.refs}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 4: Conclusion ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeadGroup}>
              <span className={styles.sectionNum}>SECTION 4</span>
              <h2 className={styles.sectionTitle}>Conclusion &amp; Next Steps</h2>
            </div>
            <hr className={styles.divider} />

            <p className={styles.prose}>
              The author demonstrates a solid grasp of modern C++ memory safety
              fundamentals. The use of{' '}
              <code className={styles.inlineCode}>std::unique_ptr</code> and{' '}
              <code className={styles.inlineCode}>{'[[nodiscard]]'}</code> is correct and
              commendable. However, the fundamental design choice to build this class from
              scratch reveals a systemic pattern of not fully leveraging the standard
              library. This suggests other parts of the codebase might contain similar
              bespoke components where{' '}
              <code className={styles.inlineCode}>std::vector</code>,{' '}
              <code className={styles.inlineCode}>std::string_view</code>, or{' '}
              <code className={styles.inlineCode}>std::optional</code> would be safer,
              more performant, and more maintainable. A full audit would focus on
              identifying these areas of reinvention and examining interactions between
              components for lifetime and ownership errors that only emerge at a system
              level.
            </p>

            <h3 className={styles.subsectionTitle}>What the full paid report adds</h3>
            <ul className={styles.upsellList}>
              <li>
                Coverage across every file in the uploaded codebase, not just a
                representative slice.
              </li>
              <li>
                Cross-cutting analysis: how findings interact across translation units.
              </li>
              <li>A prioritized remediation roadmap with effort estimates.</li>
              <li>
                A refactored reference implementation for the highest-impact issues.
              </li>
              <li>Signed PDF + machine-readable JSON + Markdown export.</li>
            </ul>
          </section>

          {/* ── CTA ── */}
          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>Ready to audit your own codebase?</h2>
            <p className={styles.ctaText}>
              Paste your C++ code into the chat and get a real-time teaser review — free.
              Pay only when you want the full report.
            </p>
            <Link to="/chat" className={styles.ctaButton}>
              Start Your Audit
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
