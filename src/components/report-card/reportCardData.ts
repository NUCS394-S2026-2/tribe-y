export interface ReportCardIssue {
  title: string;
  detail: string;
}

export interface ReportCardData {
  subject: string;
  auditId: string;
  environmentLabel: string;
  healthScore: number;
  alert: string;
  issues: ReportCardIssue[];
}

const DEFAULT_ISSUE: ReportCardIssue = {
  title: 'Review findings detected',
  detail: 'See the live teaser notes above for the first-pass expert analysis.',
};

const ISSUE_KEYWORDS = [
  'leak',
  'undefined',
  'dangling',
  'overflow',
  'race',
  'raw pointer',
  'ownership',
  'raii',
  'secret',
  'insecure',
  'critical',
  'risk',
  'bug',
];

function titleFromLine(line: string): string {
  const cleaned = line
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/\*\*/g, '')
    .trim();
  const [title] = cleaned.split(/[:.]\s/);
  return title.length > 52 ? `${title.slice(0, 49)}...` : title || 'Issue detected';
}

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, ' ').replace(/\*\*/g, '').trim();
}

function extractIssues(teaserReview: string): ReportCardIssue[] {
  const lines = teaserReview
    .split('\n')
    .map(normalizeLine)
    .filter((line) => line.length > 0);

  const issueLines = lines.filter((line) => {
    const lower = line.toLowerCase();
    return ISSUE_KEYWORDS.some((keyword) => lower.includes(keyword));
  });

  return issueLines.slice(0, 2).map((line) => ({
    title: titleFromLine(line),
    detail: line.length > 96 ? `${line.slice(0, 93)}...` : line,
  }));
}

function countIssueSignals(teaserReview: string): number {
  const lower = teaserReview.toLowerCase();
  return ISSUE_KEYWORDS.reduce(
    (total, keyword) => total + (lower.includes(keyword) ? 1 : 0),
    0,
  );
}

function scoreFromTeaser(teaserReview: string): number {
  const issueSignals = countIssueSignals(teaserReview);
  const severityPenalty = /critical|severe|high risk|undefined behavior/i.test(
    teaserReview,
  )
    ? 18
    : 8;
  const issuePenalty = Math.min(issueSignals, 5) * 7;

  return Math.max(35, Math.min(88, 92 - severityPenalty - issuePenalty));
}

function auditIdFromTeaser(teaserReview: string): string {
  let hash = 0;
  for (const char of teaserReview) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return `LIVE-${hash.toString().padStart(5, '0')}`;
}

export function createReportCardDataFromTeaser(
  teaserReview: string,
  subject = 'Live C++ teaser review',
): ReportCardData {
  const issues = extractIssues(teaserReview);
  const healthScore = scoreFromTeaser(teaserReview);

  return {
    subject,
    auditId: auditIdFromTeaser(teaserReview),
    environmentLabel: 'Live Teaser Analysis',
    healthScore,
    alert:
      healthScore < 60
        ? '> REVIEW_ALERT: High-risk findings detected in the submitted C++ snippet.'
        : '> REVIEW_ALERT: Findings detected. Full review recommended before release.',
    issues: issues.length > 0 ? issues : [DEFAULT_ISSUE],
  };
}
