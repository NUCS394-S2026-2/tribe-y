import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  convertTribeReviewsToBenchmarkData,
  parseArgs,
  TRIBE_TOOL_SLUG,
} from './convert-tribe-reviews.mjs';

const fixturesDir = path.resolve('scripts/benchmark/fixtures');

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, file), 'utf8')) as T;
}

describe('convertTribeReviewsToBenchmarkData', () => {
  test('maps tribe review findings into benchmark review comments', () => {
    const records = readJson<unknown[]>('tribe-reviews.input.json');

    const out = convertTribeReviewsToBenchmarkData({ records });
    const entry = out['https://github.com/getsentry/sentry/pull/93824'];

    expect(entry).toBeTruthy();
    expect(entry.source_repo).toBe('sentry');
    expect(Array.isArray(entry.reviews)).toBe(true);

    const imported = entry.reviews.find((r) => r.tool === TRIBE_TOOL_SLUG);
    expect(imported).toBeTruthy();
    expect(imported.review_comments.length).toBe(2);
    expect(imported.review_comments[0].line).toBe(42);
    expect(imported.review_comments[0].body).toContain(
      '[security] Unchecked pointer before dereference',
    );
    expect(imported.review_comments[0].body).toContain(
      'Recommendation: Guard user before accessing fields.',
    );
  });

  test('merges into existing benchmark data without removing existing reviews', () => {
    const records = readJson<unknown[]>('tribe-reviews.input.json');
    const existing = readJson<Record<string, unknown>>('existing-benchmark-data.json');

    const out = convertTribeReviewsToBenchmarkData({
      records,
      existingBenchmarkData: existing,
    });

    const entry = out['https://github.com/getsentry/sentry/pull/93824'];
    const tools = entry.reviews.map((r) => r.tool);

    expect(tools).toContain('claude');
    expect(tools).toContain(TRIBE_TOOL_SLUG);
    expect(entry.golden_comments.length).toBe(1);
  });
});

describe('parseArgs', () => {
  test('parses required and optional flags', () => {
    const args = parseArgs([
      '--input',
      'in.json',
      '--output',
      'out.json',
      '--merge',
      'base.json',
      '--tool',
      'tribe-custom',
    ]);

    expect(args).toEqual({
      input: 'in.json',
      output: 'out.json',
      merge: 'base.json',
      tool: 'tribe-custom',
    });
  });
});
