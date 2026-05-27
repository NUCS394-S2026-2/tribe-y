import generated from './benchmarkConfidence.generated.json';
import type { ReportType } from './reportTypes';

export interface BenchmarkConfidence {
  score: number;
  scorePercent: number;
  source: string;
  sampleSize: number;
  updatedAt: string;
}

type GeneratedConfidence = {
  overallScore?: number;
  sampleSize?: number;
  source?: string;
  updatedAt?: string;
  byReportType?: Partial<Record<ReportType, number>>;
};

const FALLBACK: BenchmarkConfidence = {
  score: 0.5,
  scorePercent: 50,
  source: 'pending-benchmark-run',
  sampleSize: 0,
  updatedAt: '1970-01-01T00:00:00.000Z',
};

function clamp01(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function getBenchmarkConfidence(reportType: ReportType): BenchmarkConfidence {
  const data = generated as GeneratedConfidence;
  const typeScore = data.byReportType?.[reportType];
  const score = clamp01(typeScore ?? data.overallScore ?? FALLBACK.score);

  return {
    score,
    scorePercent: Math.round(score * 100),
    source: data.source ?? FALLBACK.source,
    sampleSize: Number.isFinite(Number(data.sampleSize)) ? Number(data.sampleSize) : 0,
    updatedAt: data.updatedAt ?? FALLBACK.updatedAt,
  };
}
