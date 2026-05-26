import jsPDF from 'jspdf';

import type { SampleReportData, SampleReportFinding } from './types/ChatSession';

const COLORS = {
  primary: '#0f172a',
  accent: '#22d3ee',
  muted: '#64748b',
  text: '#0f172a',
  warning: '#f59e0b',
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
} as const;

const MARGIN_X = 48;
const LINE_HEIGHT = 14;
const PAGE_BOTTOM = 780;

function severityColor(sev: SampleReportFinding['severity']): string {
  if (sev === 'critical') return COLORS.critical;
  if (sev === 'high') return COLORS.high;
  if (sev === 'medium') return COLORS.medium;
  return COLORS.low;
}

interface Cursor {
  y: number;
}

function ensureSpace(pdf: jsPDF, cursor: Cursor, needed: number): void {
  if (cursor.y + needed > PAGE_BOTTOM) {
    pdf.addPage();
    cursor.y = 64;
  }
}

function writeWrapped(
  pdf: jsPDF,
  text: string,
  cursor: Cursor,
  opts: { size?: number; color?: string; bold?: boolean; indent?: number } = {},
): void {
  const size = opts.size ?? 10;
  const color = opts.color ?? COLORS.text;
  const indent = opts.indent ?? 0;
  pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  pdf.setFontSize(size);
  pdf.setTextColor(color);
  const lines = pdf.splitTextToSize(text, 515 - indent) as string[];
  for (const line of lines) {
    ensureSpace(pdf, cursor, LINE_HEIGHT);
    pdf.text(line, MARGIN_X + indent, cursor.y);
    cursor.y += LINE_HEIGHT;
  }
}

export function renderReportToPdf(data: SampleReportData): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const cursor: Cursor = { y: 64 };

  pdf.setFillColor(COLORS.primary);
  pdf.rect(0, 0, 612, 6, 'F');

  writeWrapped(pdf, 'compass.tne.ai', cursor, {
    size: 9,
    color: COLORS.accent,
    bold: true,
  });
  writeWrapped(pdf, data.reportTitle, cursor, { size: 20, bold: true });
  writeWrapped(
    pdf,
    `Sample report · lines ${data.slice.startLine}–${data.slice.endLine} · generated ${new Date(
      data.generatedAt,
    ).toLocaleString()}`,
    cursor,
    { size: 9, color: COLORS.muted },
  );
  cursor.y += 8;

  writeWrapped(pdf, 'Selected slice', cursor, {
    size: 11,
    bold: true,
    color: COLORS.accent,
  });
  writeWrapped(pdf, data.slice.reason, cursor, { size: 10, color: COLORS.muted });
  cursor.y += 4;

  writeWrapped(pdf, 'Summary', cursor, { size: 12, bold: true });
  writeWrapped(pdf, data.summary || '(no summary returned)', cursor);
  cursor.y += 6;

  writeWrapped(pdf, `Findings (${data.findings.length})`, cursor, {
    size: 12,
    bold: true,
  });

  if (data.findings.length === 0) {
    writeWrapped(pdf, 'No issues detected in the sampled slice for this focus.', cursor, {
      color: COLORS.muted,
    });
  } else {
    for (const f of data.findings) {
      cursor.y += 4;
      ensureSpace(pdf, cursor, 60);
      const header = `${f.severity.toUpperCase()}${f.line ? ` · line ${f.line}` : ''} — ${f.title}`;
      writeWrapped(pdf, header, cursor, {
        size: 11,
        bold: true,
        color: severityColor(f.severity),
      });
      writeWrapped(pdf, f.detail, cursor, { indent: 12 });
      if (f.recommendation) {
        writeWrapped(pdf, `Fix: ${f.recommendation}`, cursor, {
          indent: 12,
          color: COLORS.muted,
        });
      }
    }
  }

  cursor.y += 8;
  writeWrapped(pdf, 'Conclusion', cursor, { size: 12, bold: true });
  writeWrapped(pdf, data.conclusion || 'Pay to unlock the full report.', cursor);

  cursor.y += 16;
  writeWrapped(
    pdf,
    'This is a sample report on a single slice. The paid full report covers the entire codebase you upload.',
    cursor,
    { size: 9, color: COLORS.muted },
  );

  return pdf;
}

export function downloadReportPdf(data: SampleReportData): void {
  const pdf = renderReportToPdf(data);
  const safeTitle = data.reportTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  pdf.save(`compass-${safeTitle}-sample.pdf`);
}

export function reportPdfBlobUrl(data: SampleReportData): string {
  const pdf = renderReportToPdf(data);
  return pdf.output('bloburl') as unknown as string;
}
