import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SampleReportData } from '../../shared/types/ChatSession';
import { SampleReportMessage } from './SampleReportMessage';

function makeData(overrides: Partial<SampleReportData> = {}): SampleReportData {
  return {
    reportType: 'memory',
    reportTitle: 'Memory Safety Audit',
    slice: { startLine: 1, endLine: 5, reason: 'r', code: 'int main(){}' },
    summary: 's',
    findings: [],
    conclusion: 'c',
    scores: { overall: 5, dimensions: [{ label: 'Resource management', score: 5 }] },
    generatedAt: 0,
    ...overrides,
  };
}

describe('SampleReportMessage', () => {
  it('uses data.artifacts.pdfUrl for the download anchor when present', async () => {
    const data = makeData({
      artifacts: {
        pdfUrl: 'https://signed.example/report.pdf',
        pdfExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        pdfSha256: 'a'.repeat(64),
      },
    });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {
        /* noop — jsdom does not navigate */
      });

    render(<SampleReportMessage data={data} onPayForFullReview={() => {}} />);

    const downloadBtn = screen.getByRole('button', { name: /download pdf/i });
    expect(downloadBtn).not.toBeDisabled();
    await userEvent.click(downloadBtn);
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('disables preview + download with a tooltip when artifacts are absent', () => {
    const data = makeData();
    render(<SampleReportMessage data={data} onPayForFullReview={() => {}} />);

    const previewBtn = screen.getByRole('button', { name: /preview pdf/i });
    const downloadBtn = screen.getByRole('button', { name: /download pdf/i });
    expect(previewBtn).toBeDisabled();
    expect(downloadBtn).toBeDisabled();
    expect(previewBtn).toHaveAttribute('title', 'PDF unavailable for this review');
    expect(downloadBtn).toHaveAttribute('title', 'PDF unavailable for this review');
  });

  it('opens the preview modal with the signed URL when artifacts are present', async () => {
    const data = makeData({
      artifacts: {
        pdfUrl: 'https://signed.example/preview.pdf',
        pdfExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        pdfSha256: 'b'.repeat(64),
      },
    });
    render(<SampleReportMessage data={data} onPayForFullReview={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: /preview pdf/i }));
    // The modal renders an iframe pointing at the URL
    const iframe = document.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe('https://signed.example/preview.pdf');
  });
});
