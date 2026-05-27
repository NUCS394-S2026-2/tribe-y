import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const TRIBE_TOOL_SLUG = 'tribe-y-code-review';

function toIsoOrNow(ms) {
  const parsed = Number(ms);
  if (Number.isFinite(parsed) && parsed > 0) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function toCommentBody(entry, finding) {
  const parts = [
    `[${entry.reportType}] ${finding.title}`,
    finding.detail,
  ];

  if (finding.impact) parts.push(`Impact: ${finding.impact}`);
  if (finding.evidence) parts.push(`Evidence: ${finding.evidence}`);
  if (finding.recommendation) parts.push(`Recommendation: ${finding.recommendation}`);

  return parts.filter(Boolean).join('\n\n');
}

function toReviewComments(entry) {
  const findings = Array.isArray(entry.findings) ? entry.findings : [];

  const findingComments = findings.map((finding) => ({
    path: null,
    line: Number.isFinite(Number(finding.line)) ? Number(finding.line) : null,
    body: toCommentBody(entry, finding),
    created_at: toIsoOrNow(entry.generatedAt),
  }));

  const summaryBlock = [
    `Summary (${entry.reportTitle}): ${entry.summary ?? ''}`.trim(),
    `Conclusion: ${entry.conclusion ?? ''}`.trim(),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (summaryBlock.length >= 20) {
    findingComments.push({
      path: null,
      line: null,
      body: summaryBlock,
      created_at: toIsoOrNow(entry.generatedAt),
    });
  }

  return findingComments;
}

function ensureEntry(out, goldenUrl, entry) {
  if (!out[goldenUrl]) {
    out[goldenUrl] = {
      pr_title: entry.prTitle ?? 'Imported Tribe Y review',
      original_url: entry.originalUrl ?? goldenUrl,
      source_repo: entry.sourceRepo ?? 'unknown',
      golden_comments: [],
      reviews: [],
    };
  }
}

export function convertTribeReviewsToBenchmarkData({
  records,
  existingBenchmarkData = {},
  toolSlug = TRIBE_TOOL_SLUG,
}) {
  if (!Array.isArray(records)) {
    throw new Error('Input records must be an array');
  }

  const out = JSON.parse(JSON.stringify(existingBenchmarkData));

  for (const entry of records) {
    if (!entry || typeof entry !== 'object') continue;

    const goldenUrl = entry.goldenUrl;
    if (typeof goldenUrl !== 'string' || !goldenUrl.trim()) {
      throw new Error('Each record must include non-empty goldenUrl');
    }

    ensureEntry(out, goldenUrl, entry);

    const review = {
      tool: toolSlug,
      pr_url:
        entry.reviewUrl ??
        `https://compass.tne.ai/vault/${entry.reviewId ?? 'unknown'}?reportType=${entry.reportType ?? 'unknown'}`,
      review_comments: toReviewComments(entry),
    };

    if (review.review_comments.length === 0) {
      continue;
    }

    const existingReviews = Array.isArray(out[goldenUrl].reviews)
      ? out[goldenUrl].reviews
      : [];
    out[goldenUrl].reviews = existingReviews.filter(
      (r) => !(r?.tool === toolSlug && r?.pr_url === review.pr_url),
    );

    out[goldenUrl].reviews.push(review);
  }

  return out;
}

export function parseArgs(argv) {
  const args = {
    input: '',
    output: '',
    merge: '',
    tool: TRIBE_TOOL_SLUG,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--input') args.input = argv[i + 1] ?? '';
    if (token === '--output') args.output = argv[i + 1] ?? '';
    if (token === '--merge') args.merge = argv[i + 1] ?? '';
    if (token === '--tool') args.tool = argv[i + 1] ?? TRIBE_TOOL_SLUG;
  }

  if (!args.input) throw new Error('Missing --input <path>');
  if (!args.output) throw new Error('Missing --output <path>');
  return args;
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);

  const records = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const existing = args.merge
    ? JSON.parse(fs.readFileSync(path.resolve(args.merge), 'utf8'))
    : {};

  const converted = convertTribeReviewsToBenchmarkData({
    records,
    existingBenchmarkData: existing,
    toolSlug: args.tool,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(converted, null, 2)}\n`);

  const totalReviews = Object.values(converted).reduce((acc, val) => {
    const reviews = Array.isArray(val.reviews) ? val.reviews : [];
    return acc + reviews.filter((r) => r.tool === args.tool).length;
  }, 0);

  console.log(`Wrote ${outputPath}`);
  console.log(`Tool slug: ${args.tool}`);
  console.log(`Imported reviews: ${totalReviews}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
