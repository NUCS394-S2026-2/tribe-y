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

  test('seeds session with sales greeting', () => {
    const { result } = renderOrchestrator();

    expect(result.current.session.messages).toHaveLength(1);
    expect(result.current.session.messages[0]?.role).toBe('assistant');
    expect(result.current.session.mode).toBe('qualifying');
  });

  test('routes English messages to sales agent', async () => {
    mockRunSalesAgent.mockResolvedValue({ text: 'Tell me more about your C++ issue.' });
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('What does compass do?');
    });

    await waitFor(() => {
      expect(result.current.session.isLoading).toBe(false);
    });

    expect(mockRunSalesAgent).toHaveBeenCalled();
    expect(result.current.session.messages.at(-1)?.text).toBe(
      'Tell me more about your C++ issue.',
    );
    expect(result.current.session.mode).toBe('qualifying');
  });

  test('routes C++ input into report-type selector flow', async () => {
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('#include <iostream>\nint main() {}');
    });

    await waitFor(() => {
      expect(result.current.session.mode).toBe('selecting');
    });

    expect(result.current.session.activeReviewId).toBeTruthy();
    expect(result.current.session.messages.at(-1)?.kind).toBe('report-type-selector');
    expect(result.current.session.pendingCode).toContain('#include');
  });

  test('selectReportType invokes the A2A reviewer and renders a sample-report message', async () => {
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
      expect(result.current.session.mode).toBe('selecting');
    });

    await act(async () => {
      await result.current.selectReportType('security');
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
});
