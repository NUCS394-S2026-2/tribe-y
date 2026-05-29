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

  test('invokeReviewer posts a valid JSON-RPC envelope and returns the result', async () => {
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
      params: { code: string; reportType: string; fullReport: boolean };
      id: unknown;
    };
    expect(body.jsonrpc).toBe('2.0');
    expect(body.method).toBe('review');
    expect(body.params).toEqual({
      code: 'int main() {}',
      reportType: 'security',
      fullReport: false,
    });
    expect(body.id).toBeTruthy();
  });

  test('invokeReviewer passes fullReport=true through', async () => {
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
      params: { fullReport: boolean };
    };
    expect(body.params.fullReport).toBe(true);
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
