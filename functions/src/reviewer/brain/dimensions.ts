import { clampScore } from './parse.js';
import type { SampleReportScoreDimension } from './types.js';

export function normalizeLabel(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function alignDimensionsToCanonical(
  canonical: readonly string[],
  raw: SampleReportScoreDimension[],
): SampleReportScoreDimension[] {
  const used = new Set<number>();
  return canonical.map((canonLabel) => {
    const canonKey = normalizeLabel(canonLabel);
    let matchIdx = raw.findIndex(
      (d, i) => !used.has(i) && d?.label && normalizeLabel(String(d.label)) === canonKey,
    );
    if (matchIdx === -1) {
      matchIdx = raw.findIndex((d, i) => {
        if (used.has(i) || !d?.label) return false;
        const k = normalizeLabel(String(d.label));
        return k.includes(canonKey) || canonKey.includes(k);
      });
    }
    if (matchIdx !== -1) {
      used.add(matchIdx);
      const d = raw[matchIdx];
      return {
        label: canonLabel,
        score: clampScore(d?.score),
        note: d?.note ? String(d.note).slice(0, 100) : undefined,
      };
    }
    return { label: canonLabel, score: 0 };
  });
}
