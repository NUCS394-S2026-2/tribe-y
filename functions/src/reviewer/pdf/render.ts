// Server-side PDF renderer for the reviewer agent.
//
// Lifted from `src/shared/reportPdf.ts` (the browser-side renderer used by the
// consultant UI) in PR 4.5. The drawing code is identical; only the imports and
// the exported surface area differ:
//   - imports use `.js` extensions for the functions tsconfig (NodeNext-style)
//   - we export only `renderReportToPdf`. The browser-only conveniences
//     (`downloadReportPdf`, `reportPdfBlobUrl`) are intentionally omitted —
//     the server returns a `jsPDF` instance which the caller converts to a
//     Node `Buffer` via `pdf.output('arraybuffer')`.
// jspdf's package only exports the constructor as a named binding under
// ESM (`{ jsPDF }`). Doing `import jsPDF from 'jspdf'` returns the module
// namespace object, which is not callable — `new jsPDF(...)` throws
// "jsPDF is not a constructor" at runtime under the functions ESM build.
import { jsPDF } from 'jspdf';

import type {
  SampleReportData,
  SampleReportFinding,
  SampleReportScoreDimension,
} from '../brain/types.js';

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 56;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 64;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const LINE_H = 14;

const C = {
  ink: '#0f172a',
  text: '#1f2937',
  muted: '#64748b',
  rule: '#cbd5e1',
  brand: '#0e7490',
  accent: '#22d3ee',
  surface: '#f1f5f9',
  critical: '#b91c1c',
  high: '#c2410c',
  medium: '#a16207',
  low: '#15803d',
  good: '#15803d',
  ok: '#a16207',
  warn: '#c2410c',
  bad: '#b91c1c',
} as const;

interface Cursor {
  y: number;
  page: number;
}

interface Ctx {
  pdf: jsPDF;
  cur: Cursor;
  data: SampleReportData;
}

function severityColor(sev: SampleReportFinding['severity']): string {
  if (sev === 'critical') return C.critical;
  if (sev === 'high') return C.high;
  if (sev === 'medium') return C.medium;
  return C.low;
}

function scoreColor(score: number): string {
  if (score >= 8) return C.good;
  if (score >= 5) return C.ok;
  if (score >= 3) return C.warn;
  return C.bad;
}

function gradeFor(score: number): string {
  if (score >= 9) return 'A';
  if (score >= 8) return 'A-';
  if (score >= 7) return 'B';
  if (score >= 6) return 'B-';
  if (score >= 5) return 'C';
  if (score >= 4) return 'C-';
  if (score >= 3) return 'D';
  return 'F';
}

function setFont(
  pdf: jsPDF,
  style: 'normal' | 'bold' | 'italic',
  size: number,
  color: string,
): void {
  const family =
    style === 'italic' ? 'helvetica' : style === 'bold' ? 'helvetica' : 'helvetica';
  const variant = style === 'italic' ? 'italic' : style === 'bold' ? 'bold' : 'normal';
  pdf.setFont(family, variant);
  pdf.setFontSize(size);
  pdf.setTextColor(color);
}

function pageFooter(pdf: jsPDF, page: number, data: SampleReportData): void {
  setFont(pdf, 'normal', 8, C.muted);
  pdf.text('compass.tne.ai · confidential sample report', MARGIN_X, PAGE_H - 32);
  pdf.text(`${data.reportTitle} · page ${page}`, PAGE_W - MARGIN_X, PAGE_H - 32, {
    align: 'right',
  });
  pdf.setDrawColor(C.rule);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN_X, PAGE_H - 44, PAGE_W - MARGIN_X, PAGE_H - 44);
}

function newPage(ctx: Ctx): void {
  pageFooter(ctx.pdf, ctx.cur.page, ctx.data);
  ctx.pdf.addPage();
  ctx.cur.page += 1;
  ctx.cur.y = MARGIN_TOP;
}

function ensure(ctx: Ctx, needed: number): void {
  if (ctx.cur.y + needed > PAGE_H - MARGIN_BOTTOM) {
    newPage(ctx);
  }
}

interface WriteOpts {
  size?: number;
  color?: string;
  style?: 'normal' | 'bold' | 'italic';
  indent?: number;
  spacingAfter?: number;
  align?: 'left' | 'right' | 'center';
}

function writeText(ctx: Ctx, text: string, opts: WriteOpts = {}): void {
  if (!text) return;
  const size = opts.size ?? 10;
  const color = opts.color ?? C.text;
  const style = opts.style ?? 'normal';
  const indent = opts.indent ?? 0;
  const align = opts.align ?? 'left';
  setFont(ctx.pdf, style, size, color);
  const widthAvail = CONTENT_W - indent;
  const lines = ctx.pdf.splitTextToSize(text, widthAvail) as string[];
  const lineH = Math.max(LINE_H, size * 1.35);
  for (const line of lines) {
    ensure(ctx, lineH);
    const x =
      align === 'right'
        ? PAGE_W - MARGIN_X
        : align === 'center'
          ? PAGE_W / 2
          : MARGIN_X + indent;
    ctx.pdf.text(line, x, ctx.cur.y, { align });
    ctx.cur.y += lineH;
  }
  if (opts.spacingAfter) ctx.cur.y += opts.spacingAfter;
}

function rule(ctx: Ctx, color: string = C.rule, spacing = 10): void {
  ensure(ctx, spacing + 2);
  ctx.pdf.setDrawColor(color);
  ctx.pdf.setLineWidth(0.5);
  ctx.pdf.line(MARGIN_X, ctx.cur.y, PAGE_W - MARGIN_X, ctx.cur.y);
  ctx.cur.y += spacing;
}

function sectionHeading(ctx: Ctx, kicker: string, title: string): void {
  ensure(ctx, 60);
  ctx.cur.y += 6;
  writeText(ctx, kicker.toUpperCase(), {
    size: 8,
    color: C.brand,
    style: 'bold',
  });
  writeText(ctx, title, { size: 18, style: 'bold', color: C.ink, spacingAfter: 4 });
  rule(ctx, C.brand, 12);
}

function chip(
  ctx: Ctx,
  text: string,
  color: string,
  x: number,
  y: number,
): { x: number; y: number; w: number } {
  setFont(ctx.pdf, 'bold', 8, color);
  const tw = ctx.pdf.getTextWidth(text) + 12;
  ctx.pdf.setDrawColor(color);
  ctx.pdf.setLineWidth(0.6);
  ctx.pdf.rect(x, y - 10, tw, 14);
  ctx.pdf.text(text, x + 6, y);
  return { x: x + tw + 6, y, w: tw };
}

function drawCoverPage(ctx: Ctx): void {
  const { pdf, data } = ctx;
  pdf.setFillColor(C.ink);
  pdf.rect(0, 0, PAGE_W, 220, 'F');
  pdf.setFillColor(C.brand);
  pdf.rect(0, 220, PAGE_W, 4, 'F');

  setFont(pdf, 'bold', 11, C.accent);
  pdf.text('compass.tne.ai', MARGIN_X, 76);

  setFont(pdf, 'normal', 9, '#94a3b8');
  pdf.text('C++ EXPERT CODE REVIEW · SAMPLE REPORT', MARGIN_X, 96);

  setFont(pdf, 'bold', 28, '#ffffff');
  const titleLines = pdf.splitTextToSize(data.reportTitle, CONTENT_W) as string[];
  let ty = 138;
  for (const line of titleLines) {
    pdf.text(line, MARGIN_X, ty);
    ty += 30;
  }

  setFont(pdf, 'normal', 10, '#cbd5e1');
  pdf.text(`Generated ${new Date(data.generatedAt).toLocaleString()}`, MARGIN_X, 198);

  ctx.cur.y = 260;

  writeText(ctx, 'EXECUTIVE SCORECARD', {
    size: 9,
    color: C.brand,
    style: 'bold',
    spacingAfter: 6,
  });

  const overall = data.scores.overall;
  const overallColor = scoreColor(overall);

  // Overall score block
  ensure(ctx, 110);
  const boxTop = ctx.cur.y;
  pdf.setDrawColor(overallColor);
  pdf.setLineWidth(1);
  pdf.rect(MARGIN_X, boxTop, 160, 100);

  setFont(pdf, 'bold', 56, overallColor);
  pdf.text(String(overall), MARGIN_X + 16, boxTop + 64);
  setFont(pdf, 'normal', 12, C.muted);
  pdf.text('/ 10', MARGIN_X + 88, boxTop + 64);
  setFont(pdf, 'bold', 10, C.muted);
  pdf.text(`GRADE ${gradeFor(overall)}`, MARGIN_X + 16, boxTop + 86);

  // Dimensions table to the right
  const tableX = MARGIN_X + 180;
  const tableW = CONTENT_W - 180;
  let dy = boxTop + 14;
  setFont(pdf, 'bold', 9, C.muted);
  pdf.text('DIMENSION', tableX, dy);
  pdf.text('SCORE', tableX + tableW - 80, dy);
  pdf.text('GRADE', tableX + tableW - 30, dy);
  dy += 6;
  pdf.setDrawColor(C.rule);
  pdf.line(tableX, dy, tableX + tableW, dy);
  dy += 14;

  for (const d of data.scores.dimensions.slice(0, 6)) {
    setFont(pdf, 'normal', 10, C.text);
    pdf.text(d.label, tableX, dy);
    setFont(pdf, 'bold', 10, scoreColor(d.score));
    pdf.text(`${d.score}/10`, tableX + tableW - 80, dy);
    pdf.text(gradeFor(d.score), tableX + tableW - 30, dy);
    dy += 14;
    if (d.note) {
      setFont(pdf, 'italic', 8, C.muted);
      const noteLines = pdf.splitTextToSize(d.note, tableW - 8) as string[];
      for (const nl of noteLines) {
        pdf.text(nl, tableX + 8, dy);
        dy += 11;
      }
      dy += 2;
    }
  }

  ctx.cur.y = Math.max(boxTop + 110, dy + 8) + 16;

  // Tally bar
  const counts = data.findings.reduce(
    (acc, f) => {
      acc[f.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 } as Record<
      SampleReportFinding['severity'],
      number
    >,
  );

  writeText(ctx, 'FINDINGS BY SEVERITY', {
    size: 9,
    color: C.brand,
    style: 'bold',
    spacingAfter: 8,
  });
  ensure(ctx, 24);
  let cx = MARGIN_X;
  const chipY = ctx.cur.y;
  cx = chip(ctx, `${counts.critical} CRITICAL`, C.critical, cx, chipY).x;
  cx = chip(ctx, `${counts.high} HIGH`, C.high, cx, chipY).x;
  cx = chip(ctx, `${counts.medium} MEDIUM`, C.medium, cx, chipY).x;
  chip(ctx, `${counts.low} LOW`, C.low, cx, chipY);
  ctx.cur.y += 18;
}

function drawExecutiveSummary(ctx: Ctx): void {
  sectionHeading(ctx, 'Section 1', 'Executive Summary');
  writeText(ctx, ctx.data.summary || 'No summary provided.', {
    size: 11,
    color: C.text,
    spacingAfter: 12,
  });

  writeText(ctx, 'Scoring rationale', {
    size: 11,
    style: 'bold',
    spacingAfter: 4,
  });
  for (const d of ctx.data.scores.dimensions) {
    drawDimensionRow(ctx, d);
  }
}

function drawDimensionRow(ctx: Ctx, d: SampleReportScoreDimension): void {
  ensure(ctx, 28);
  const yStart = ctx.cur.y;
  setFont(ctx.pdf, 'bold', 10, C.text);
  ctx.pdf.text(d.label, MARGIN_X, yStart);
  setFont(ctx.pdf, 'bold', 10, scoreColor(d.score));
  ctx.pdf.text(`${d.score}/10`, PAGE_W - MARGIN_X, yStart, { align: 'right' });

  const barY = yStart + 4;
  const barW = CONTENT_W;
  ctx.pdf.setDrawColor(C.rule);
  ctx.pdf.setFillColor(C.surface);
  ctx.pdf.rect(MARGIN_X, barY, barW, 6, 'F');
  ctx.pdf.setFillColor(scoreColor(d.score));
  ctx.pdf.rect(MARGIN_X, barY, (barW * d.score) / 10, 6, 'F');

  ctx.cur.y = barY + 14;
  if (d.note) {
    writeText(ctx, d.note, { size: 9, color: C.muted, style: 'italic', spacingAfter: 6 });
  } else {
    ctx.cur.y += 4;
  }
}

function drawMethodology(ctx: Ctx): void {
  sectionHeading(ctx, 'Section 2', 'Methodology');
  writeText(
    ctx,
    `This sample report was produced by the compass.tne.ai C++ Expert Agent against the focus area defined by the chosen report type. The agent first triages the submitted snippet and selects a representative, review-worthy slice; it then performs a structured analysis against domain-specific rules and produces this scored report.`,
    { spacingAfter: 8 },
  );
  writeText(ctx, 'Slice selected for this sample', {
    size: 11,
    style: 'bold',
    spacingAfter: 4,
  });
  writeText(
    ctx,
    `Lines ${ctx.data.slice.startLine}–${ctx.data.slice.endLine} · ${ctx.data.slice.reason}`,
    { color: C.muted, spacingAfter: 10 },
  );
  drawCodeBlock(ctx, ctx.data.slice.code, ctx.data.slice.startLine);
}

function drawCodeBlock(ctx: Ctx, code: string, startLine = 1): void {
  if (!code) return;
  const { pdf } = ctx;
  const lines = code.split('\n');
  const gutterW = 32;
  const padX = 8;
  const lineH = 11;

  ensure(ctx, lineH + 10);
  let top = ctx.cur.y;
  pdf.setFillColor(C.surface);
  pdf.setDrawColor(C.rule);
  pdf.setLineWidth(0.5);
  let blockHeight = 8;

  for (let i = 0; i < lines.length; i += 1) {
    const lineNum = startLine + i;
    const lineText = lines[i] ?? '';

    if (ctx.cur.y + lineH > PAGE_H - MARGIN_BOTTOM) {
      // close current block
      pdf.rect(MARGIN_X, top, CONTENT_W, blockHeight, 'S');
      newPage(ctx);
      top = ctx.cur.y;
      blockHeight = 8;
    }

    if (blockHeight === 8) {
      // draw a fresh background for the new chunk
      const remaining = Math.min(
        lines.length - i,
        Math.floor((PAGE_H - MARGIN_BOTTOM - ctx.cur.y - 8) / lineH),
      );
      pdf.setFillColor(C.surface);
      pdf.rect(MARGIN_X, top, CONTENT_W, remaining * lineH + 12, 'F');
    }

    setFont(pdf, 'normal', 8, C.muted);
    pdf.text(String(lineNum).padStart(4, ' '), MARGIN_X + padX, ctx.cur.y + 8);
    setFont(pdf, 'normal', 9, C.text);
    const safe = lineText.replace(/\t/g, '  ');
    const truncated =
      pdf.getTextWidth(safe) > CONTENT_W - gutterW - padX * 2
        ? pdf.splitTextToSize(safe, CONTENT_W - gutterW - padX * 2)[0] + '…'
        : safe;
    pdf.text(truncated, MARGIN_X + padX + gutterW, ctx.cur.y + 8);

    ctx.cur.y += lineH;
    blockHeight += lineH;
  }

  pdf.setFillColor(C.surface);
  pdf.setDrawColor(C.rule);
  pdf.rect(MARGIN_X, top, CONTENT_W, blockHeight, 'S');
  ctx.cur.y += 12;
}

function drawFindings(ctx: Ctx): void {
  sectionHeading(ctx, 'Section 3', 'Detailed Findings');

  if (ctx.data.findings.length === 0) {
    writeText(
      ctx,
      'No issues were detected in the sampled slice for this focus. The full paid report scans the entire codebase and may surface issues elsewhere.',
      { color: C.muted, style: 'italic' },
    );
    return;
  }

  ctx.data.findings.forEach((f, i) => drawFinding(ctx, f, i + 1));
}

function drawFinding(ctx: Ctx, f: SampleReportFinding, index: number): void {
  ensure(ctx, 110);
  const sevColor = severityColor(f.severity);

  // Header bar
  const yTop = ctx.cur.y;
  ctx.pdf.setFillColor(sevColor);
  ctx.pdf.rect(MARGIN_X, yTop, 4, 22, 'F');

  setFont(ctx.pdf, 'bold', 8, sevColor);
  ctx.pdf.text(
    `${f.severity.toUpperCase()}${f.line !== undefined ? ` · LINE ${f.line}` : ''}`,
    MARGIN_X + 12,
    yTop + 9,
  );
  setFont(ctx.pdf, 'bold', 13, C.ink);
  const titleLines = ctx.pdf.splitTextToSize(
    `${index}. ${f.title}`,
    CONTENT_W - 16,
  ) as string[];
  let ty = yTop + 20;
  for (const tl of titleLines) {
    ctx.pdf.text(tl, MARGIN_X + 12, ty);
    ty += 16;
  }
  ctx.cur.y = ty + 4;

  if (f.detail) {
    writeText(ctx, f.detail, { size: 10, indent: 12, spacingAfter: 6 });
  }

  if (f.evidence) {
    writeText(ctx, 'EVIDENCE', {
      size: 8,
      style: 'bold',
      color: C.muted,
      indent: 12,
      spacingAfter: 2,
    });
    drawQuoteBlock(ctx, f.evidence);
  }

  if (f.impact) {
    writeText(ctx, 'IMPACT', {
      size: 8,
      style: 'bold',
      color: C.muted,
      indent: 12,
      spacingAfter: 2,
    });
    writeText(ctx, f.impact, { size: 10, indent: 12, spacingAfter: 6 });
  }

  if (f.recommendation) {
    writeText(ctx, 'RECOMMENDATION', {
      size: 8,
      style: 'bold',
      color: C.brand,
      indent: 12,
      spacingAfter: 2,
    });
    writeText(ctx, f.recommendation, { size: 10, indent: 12, spacingAfter: 6 });
  }

  if (f.codeFix) {
    writeText(ctx, 'SUGGESTED FIX', {
      size: 8,
      style: 'bold',
      color: C.brand,
      indent: 12,
      spacingAfter: 2,
    });
    drawCodeBlock(ctx, f.codeFix);
  }

  if (f.references && f.references.length > 0) {
    writeText(ctx, `References: ${f.references.join(' · ')}`, {
      size: 9,
      color: C.muted,
      style: 'italic',
      indent: 12,
      spacingAfter: 4,
    });
  }

  rule(ctx, C.rule, 14);
}

function drawQuoteBlock(ctx: Ctx, text: string): void {
  const { pdf } = ctx;
  const indent = 12;
  const padX = 8;
  const innerW = CONTENT_W - indent - padX * 2;
  setFont(pdf, 'normal', 9, C.text);
  const lines = pdf.splitTextToSize(text, innerW) as string[];
  const lineH = 11;
  ensure(ctx, lines.length * lineH + 10);
  const top = ctx.cur.y;
  pdf.setFillColor(C.surface);
  pdf.rect(MARGIN_X + indent, top, CONTENT_W - indent, lines.length * lineH + 10, 'F');
  pdf.setDrawColor(C.muted);
  pdf.setLineWidth(2);
  pdf.line(MARGIN_X + indent, top, MARGIN_X + indent, top + lines.length * lineH + 10);

  let ly = top + 12;
  for (const l of lines) {
    pdf.text(l, MARGIN_X + indent + padX, ly);
    ly += lineH;
  }
  ctx.cur.y = top + lines.length * lineH + 16;
}

function drawConclusion(ctx: Ctx): void {
  sectionHeading(ctx, 'Section 4', 'Conclusion & Next Steps');
  writeText(
    ctx,
    ctx.data.conclusion ||
      'This sample illustrates the depth of review your team will receive. Unlock the full report to extend this analysis across your entire codebase.',
    { size: 11, color: C.text, spacingAfter: 14 },
  );

  writeText(ctx, 'What the full paid report adds', {
    size: 11,
    style: 'bold',
    spacingAfter: 4,
  });
  const bullets = [
    'Coverage across every file in the uploaded codebase, not just a representative slice.',
    'Cross-cutting analysis: how findings interact across translation units.',
    'A prioritized remediation roadmap with effort estimates.',
    'A refactored reference implementation for the highest-impact issues.',
    'Signed PDF + machine-readable JSON + Markdown export.',
  ];
  for (const b of bullets) {
    writeText(ctx, `•  ${b}`, { indent: 8, spacingAfter: 2 });
  }
}

export function renderReportToPdf(data: SampleReportData): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const ctx: Ctx = { pdf, cur: { y: MARGIN_TOP, page: 1 }, data };

  drawCoverPage(ctx);

  newPage(ctx);
  drawExecutiveSummary(ctx);

  ctx.cur.y += 6;
  drawMethodology(ctx);

  ctx.cur.y += 6;
  drawFindings(ctx);

  ctx.cur.y += 6;
  drawConclusion(ctx);

  pageFooter(pdf, ctx.cur.page, data);
  return pdf;
}
