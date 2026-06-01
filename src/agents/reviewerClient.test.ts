import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { SampleReportData } from '../shared/types/ChatSession';
import {
  __resetAgentCardCache,
  type AgentCard,
  fetchAgentCard,
  invokeReviewer,
} from './reviewerClient';

const FAKE_CARD: AgentCard = {
  name: 'Test Reviewer',
  description: 'test',
  version: '0.0.1',
  endpoint: 'http://localhost/rpc',
  methods: [
    {
      name: 'review',
      description: 'review',
      params: '{ code: string }',
      result: 'SampleReportData',
      paid: false,
    },
  ],
};

const FAKE_REPORT: SampleReportData = {
  reportType: 'security',
  reportTitle: 'Security Vulnerability Report',
  slice: { startLine: 1, endLine: 1, reason: 'r', code: 'int x;' },
  summary: 's',
  findings: [],
  conclusion: 'c',
  scores: { overall: 7, dimensions: [{ label: 'Input validation', score: 7 }] },
  generatedAt: 0,
};

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
}

describe('reviewerClient', () => {
  beforeEach(() => {
    __resetAgentCardCache();
    vi.stubGlobal('window', { location: { host: 'localhost' } } as unknown as Window &
      typeof globalThis);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('fetchAgentCard happy path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(FAKE_CARD));
    vi.stubGlobal('fetch', fetchMock);

    const card = await fetchAgentCard();

    expect(card).toEqual(FAKE_CARD);
    expect(fetchMock).toHaveBeenCalledWith('/.well-known/agent.json');
  });

  test('fetchAgentCard caches across calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(FAKE_CARD));
    vi.stubGlobal('fetch', fetchMock);

    await fetchAgentCard();
    await fetchAgentCard();
    await fetchAgentCard();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('fetchAgentCard rejects when card fetch is non-OK', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('nope', { status: 500, statusText: 'oops' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAgentCard()).rejects.toThrow(/HTTP 500/);
  });

  test('invokeReviewer posts a reviewSample envelope by default', async () => {
    const fetchMock = vi
      .fn()
      // 1st call: agent card
      .mockResolvedValueOnce(jsonResponse(FAKE_CARD))
      // 2nd call: review
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 'x', result: FAKE_REPORT }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const out = await invokeReviewer({
      code: 'int main() {}',
      reportType: 'security',
    });

    expect(out).toEqual(FAKE_REPORT);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe('http://localhost/rpc');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as {
      jsonrpc: string;
      method: string;
      params: { code: string; reportType: string; fullReport?: boolean };
      id: unknown;
    };
    expect(body.jsonrpc).toBe('2.0');
    expect(body.method).toBe('reviewSample');
    expect(body.params).toEqual({
      code: 'int main() {}',
      reportType: 'security',
    });
    expect(body.params.fullReport).toBeUndefined();
    expect(body.id).toBeTruthy();
  });

  test('invokeReviewer routes to reviewFull when fullReport=true', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FAKE_CARD))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: FAKE_REPORT }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await invokeReviewer({
      code: 'int main() {}',
      reportType: 'memory',
      fullReport: true,
    });

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      method: string;
      params: { code: string; reportType: string; fullReport?: boolean };
    };
    expect(body.method).toBe('reviewFull');
    expect(body.params.fullReport).toBeUndefined();
  });

  test('invokeReviewer throws when the server returns a JSON-RPC error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FAKE_CARD))
      .mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: 'x',
          error: { code: -32602, message: 'Invalid reportType' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(invokeReviewer({ code: 'x', reportType: 'security' })).rejects.toThrow(
      /-32602.*Invalid reportType/,
    );
  });

  test('invokeReviewer throws on non-OK HTTP', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FAKE_CARD))
      .mockResolvedValueOnce(
        new Response('boom', { status: 500, statusText: 'Internal Error' }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(invokeReviewer({ code: 'x', reportType: 'security' })).rejects.toThrow(
      /HTTP 500/,
    );
  });

  test('invokeReviewer handles 402 by paying and retrying with X-Payment header', async () => {
    const quote = {
      amount: 1_000_000,
      currency: 'SOL_LAMPORTS',
      network: 'solana-devnet',
      recipient: '2vCfh5Cia6iwb7uBfrWeXaG6UtvTzV6kzzH5XCfAVmZp',
      expiresAt: '2099-01-01T00:00:00Z',
      nonce: 'abc',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FAKE_CARD))
      .mockResolvedValueOnce(jsonResponse(quote, { status: 402 }))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: FAKE_REPORT }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const pay = vi.fn().mockResolvedValue('fake-sig');

    const out = await invokeReviewer({
      code: 'int main() {}',
      reportType: 'security',
      fullReport: true,
      pay,
    });

    expect(out).toEqual(FAKE_REPORT);
    expect(pay).toHaveBeenCalledWith(expect.objectContaining({ amount: 1_000_000 }));
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    const retryHeaders = retryInit.headers as Record<string, string>;
    expect(retryHeaders['X-Payment']).toBe('fake-sig');
    expect(retryHeaders['Content-Type']).toBe('application/json');
  });

  test('invokeReviewer throws a friendly error when 402 arrives without a pay callback', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FAKE_CARD))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            amount: 1_000_000,
            currency: 'SOL_LAMPORTS',
            network: 'solana-devnet',
            recipient: 'r',
            expiresAt: 'x',
            nonce: 'n',
          },
          { status: 402 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      invokeReviewer({ code: 'x', reportType: 'security', fullReport: true }),
    ).rejects.toThrow(/connect a wallet first/i);
  });

  test('invokeReviewer surfaces pay-callback rejections with the original message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FAKE_CARD))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            amount: 1_000_000,
            currency: 'SOL_LAMPORTS',
            network: 'solana-devnet',
            recipient: 'r',
            expiresAt: 'x',
            nonce: 'n',
          },
          { status: 402 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const pay = vi.fn().mockRejectedValue(new Error('Payment cancelled.'));

    await expect(
      invokeReviewer({
        code: 'x',
        reportType: 'security',
        fullReport: true,
        pay,
      }),
    ).rejects.toThrow(/Payment cancelled\./);
    expect(fetchMock).toHaveBeenCalledTimes(2); // no retry
  });

  test('invokeReviewer falls back to /rpc when the card host does not match window.location', async () => {
    const otherHostCard: AgentCard = {
      ...FAKE_CARD,
      endpoint: 'http://127.0.0.1:5002/rpc',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(otherHostCard))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: FAKE_REPORT }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await invokeReviewer({ code: 'x', reportType: 'security' });

    const [url] = fetchMock.mock.calls[1] as [string];
    expect(url).toBe('/rpc');
  });
});
