import type { SampleReportScoreDimension } from '../types/ChatSession';
import { clampScore } from './parse';

export function normalizeLabel(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function alignDimensionsToCanonical(
  canonical: readonly string[],
  raw: SampleReportScoreDimension[],
): SampleReportScoreDimension[] {
  // Match each canonical label to the best raw entry by normalized comparison.
  // Returns dimensions in canonical order using canonical labels verbatim.
  const used = new Set<number>();
  return canonical.map((canonLabel) => {
    const canonKey = normalizeLabel(canonLabel);
    let matchIdx = raw.findIndex(
      (d, i) => !used.has(i) && d?.label && normalizeLabel(String(d.label)) === canonKey,
    );
    if (matchIdx === -1) {
      // fuzzy: substring either way
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
