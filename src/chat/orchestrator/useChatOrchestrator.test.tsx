import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useChatOrchestrator } from './useChatOrchestrator';

vi.mock('../../agents/salesAgent', () => ({
  runSalesAgent: vi.fn(),
}));

vi.mock('../../agents/reviewerClient', () => ({
  invokeReviewer: vi.fn(),
}));

vi.mock('../../shared/firebase', () => ({
  auth: {
    authStateReady: vi.fn().mockResolvedValue(undefined),
    currentUser: { uid: 'user-1' },
  },
}));

vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({ connection: {} }),
  useWallet: () => ({
    connected: false,
    publicKey: null,
    sendTransaction: undefined,
    disconnect: vi.fn(),
  }),
}));

vi.mock('../../wallet/payQuote', () => ({
  payQuote: vi.fn(),
}));

import { invokeReviewer } from '../../agents/reviewerClient';
import { runSalesAgent } from '../../agents/salesAgent';

const mockRunSalesAgent = vi.mocked(runSalesAgent);
const mockInvokeReviewer = vi.mocked(invokeReviewer);

function renderOrchestrator() {
  return renderHook(() => useChatOrchestrator(), {
    wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
  });
}

describe('useChatOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('seeds session with consultant greeting', () => {
    const { result } = renderOrchestrator();

    expect(result.current.session.messages).toHaveLength(1);
    expect(result.current.session.messages[0]?.role).toBe('assistant');
    expect(result.current.session.mode).toBe('qualifying');
  });

  test('routes plain conversation through the consultant — no review fires', async () => {
    mockRunSalesAgent.mockResolvedValue({
      text: 'What are you building?',
    });
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('What does compass do?');
    });

    await waitFor(() => {
      expect(result.current.session.isLoading).toBe(false);
    });

    expect(mockRunSalesAgent).toHaveBeenCalled();
    expect(mockInvokeReviewer).not.toHaveBeenCalled();
    expect(result.current.session.messages.at(-1)?.text).toBe('What are you building?');
    expect(result.current.session.mode).toBe('qualifying');
  });

  test('captures pendingCode when the user pastes C++ but defers to the consultant', async () => {
    mockRunSalesAgent.mockResolvedValue({
      text: 'Thanks for the snippet — what is your top concern: security, perf, or memory?',
    });
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('#include <iostream>\nint main() {}');
    });

    await waitFor(() => {
      expect(result.current.session.isLoading).toBe(false);
    });

    expect(result.current.session.pendingCode).toContain('#include');
    expect(result.current.session.activeReviewId).toBeTruthy();
    // No selector card should auto-appear anymore.
    expect(mockInvokeReviewer).not.toHaveBeenCalled();
    expect(
      result.current.session.messages.some((m) => m.kind === 'report-type-selector'),
    ).toBe(false);
  });

  test('initiate_review action triggers the reviewer when code is pending', async () => {
    mockRunSalesAgent
      .mockResolvedValueOnce({ text: 'Got it — paste the code.' })
      .mockResolvedValueOnce({
        text: 'Running the Security report on what you pasted.',
        action: { type: 'initiate_review', reportType: 'security', fullReport: false },
      });
    mockInvokeReviewer.mockResolvedValue({
      reportType: 'security',
      reportTitle: 'Security Vulnerability Report',
      slice: { startLine: 1, endLine: 2, reason: 'r', code: 'int main() {}' },
      summary: 'sum',
      findings: [],
      conclusion: 'c',
      scores: { overall: 8, dimensions: [{ label: 'Input validation', score: 8 }] },
      generatedAt: 0,
    });

    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('#include <iostream>\nint main() {}');
    });
    await waitFor(() => {
      expect(result.current.session.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('yes please run a security review');
    });
    await waitFor(() => {
      expect(result.current.session.mode).toBe('sample');
    });

    expect(mockInvokeReviewer).toHaveBeenCalledWith(
      expect.objectContaining({
        code: expect.stringContaining('#include'),
        reportType: 'security',
      }),
    );
    expect(result.current.session.messages.at(-1)?.kind).toBe('sample-report');
    expect(result.current.session.selectedReportType).toBe('security');
  });

  test('initiate_review without pendingCode surfaces a friendly nudge', async () => {
    mockRunSalesAgent.mockResolvedValue({
      text: 'Starting the memory audit.',
      action: { type: 'initiate_review', reportType: 'memory', fullReport: false },
    });
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('go ahead');
    });
    await waitFor(() => {
      expect(result.current.session.isLoading).toBe(false);
    });

    expect(mockInvokeReviewer).not.toHaveBeenCalled();
    const lastText = result.current.session.messages.at(-1)?.text ?? '';
    expect(lastText.toLowerCase()).toContain("don't have any code");
  });

  test('selectReportType still works via direct card click (selector path preserved)', async () => {
    mockRunSalesAgent.mockResolvedValue({ text: 'Thanks for the snippet.' });
    mockInvokeReviewer.mockResolvedValue({
      reportType: 'security',
      reportTitle: 'Security Vulnerability Report',
      slice: { startLine: 1, endLine: 2, reason: 'r', code: 'int main() {}' },
      summary: 'sum',
      findings: [],
      conclusion: 'c',
      scores: { overall: 8, dimensions: [{ label: 'Input validation', score: 8 }] },
      generatedAt: 0,
    });
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('#include <iostream>\nint main() {}');
    });
    await waitFor(() => {
      expect(result.current.session.pendingCode).toBeTruthy();
    });

    await act(async () => {
      await result.current.selectReportType('security');
    });
    await waitFor(() => {
      expect(result.current.session.mode).toBe('sample');
    });

    expect(result.current.session.selectedReportType).toBe('security');
  });
});
