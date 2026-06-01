// Render-and-upload a PDF for a `SampleReportData` to Firebase Storage and
// return a short-lived v4 signed URL.
//
// Dedup: the object path is content-addressed over the FULL review data
// (scores + findings + summary + conclusion + slice) so the PDF on disk
// always matches the JSON we just returned to the caller. Hashing only on
// the request inputs (snippet + reportType + fullReport) caused stale PDFs
// to be re-served whenever Gemini's non-deterministic output gave a
// different score on a fresh run.
//
// Failure mode: callers (review.ts) treat all errors here as best-effort. If
// the bucket isn't configured or the upload fails, the review JSON still goes
// out — the `artifacts` field will simply be absent in the response.
import { createHash } from 'crypto';
import { getStorage } from 'firebase-admin/storage';

import type { SampleReportData } from '../brain/types.js';
import { renderReportToPdf } from './render.js';

/**
 * Signed URL TTL. 24 hours strikes a balance between giving an A2A caller
 * enough time to fetch the artifact at human-in-the-loop pace and not handing
 * out long-lived bearer-style links. Bump deliberately if a use case needs it.
 */
const SIGNED_URL_TTL_MS = 24 * 60 * 60 * 1000;

export interface UploadedPdfArtifact {
  pdfUrl: string;
  pdfExpiresAt: string;
  pdfSha256: string;
}

/**
 * For Storage object metadata: keep only filename-safe characters so the
 * `Content-Disposition` header doesn't need elaborate encoding.
 */
function safeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'report';
}

/**
 * Hex sha256 keyed on the full review payload. This guarantees the PDF
 * we serve matches the JSON we just returned — same scores, same
 * findings, same summary. Gemini is non-deterministic, so two calls with
 * identical inputs can produce different output; without including the
 * output in the hash we'd serve a stale PDF.
 */
function computeContentHash(
  snippet: string,
  reportType: string,
  fullReport: boolean,
  data: SampleReportData,
): string {
  const dataKey = JSON.stringify({
    scores: data.scores,
    findings: data.findings,
    summary: data.summary,
    conclusion: data.conclusion,
    slice: data.slice,
  });
  const key = `${snippet}|${reportType}|${fullReport ? '1' : '0'}|${dataKey}`;
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/**
 * Render the PDF for `data`, upload to Firebase Storage at a content-addressed
 * path, and return a v4 signed read URL valid for 24h.
 *
 * If an object already exists at the target path (i.e. identical request seen
 * before), the render+upload is skipped and a fresh signed URL is generated.
 */
export async function buildAndUploadReportPdf(
  data: SampleReportData,
  snippet: string,
  reportType: string,
  fullReport: boolean,
): Promise<UploadedPdfArtifact> {
  const pdfSha256 = computeContentHash(snippet, reportType, fullReport, data);
  const path = `reports/${pdfSha256}.pdf`;

  const bucket = getStorage().bucket();
  const file = bucket.file(path);

  const [exists] = await file.exists();
  if (!exists) {
    const pdf = renderReportToPdf(data);
    const arrayBuffer = pdf.output('arraybuffer') as ArrayBuffer;
    const buffer = Buffer.from(arrayBuffer);
    await file.save(buffer, {
      contentType: 'application/pdf',
      metadata: {
        contentDisposition: `inline; filename="${safeFilename(data.reportTitle)}.pdf"`,
      },
    });
  }

  const expiresAtMs = Date.now() + SIGNED_URL_TTL_MS;
  const [pdfUrl] = await file.getSignedUrl({
    action: 'read',
    version: 'v4',
    expires: expiresAtMs,
  });

  return {
    pdfUrl,
    pdfExpiresAt: new Date(expiresAtMs).toISOString(),
    pdfSha256,
  };
}
