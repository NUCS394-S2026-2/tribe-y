import { describe, expect, it } from 'vitest';

import { buildAgentCard, deriveRpcEndpoint } from './agentCard.js';

describe('buildAgentCard', () => {
  it('returns the expected shape', () => {
    const card = buildAgentCard('https://example.com/rpc');
    expect(card.name).toBe('compass.tne.ai Code Reviewer (Bjarne)');
    expect(card.version).toBe('0.1.0');
    expect(card.endpoint).toBe('https://example.com/rpc');
    expect(card.methods).toHaveLength(2);
  });

  it('advertises listReportTypes as free', () => {
    const card = buildAgentCard('https://example.com/rpc');
    const m = card.methods.find((x) => x.name === 'listReportTypes');
    expect(m).toBeDefined();
    expect(m?.paid).toBe(false);
  });

  it('advertises review as paid (not yet implemented)', () => {
    const card = buildAgentCard('https://example.com/rpc');
    const m = card.methods.find((x) => x.name === 'review');
    expect(m).toBeDefined();
    expect(m?.paid).toBe(true);
    expect(m?.pricing?.network).toBe('solana-devnet');
    expect(m?.pricing?.recipient).toBeNull();
  });
});

describe('deriveRpcEndpoint', () => {
  it('honors x-forwarded-proto and x-forwarded-host', () => {
    expect(
      deriveRpcEndpoint({
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'reviewer.example.com',
      }),
    ).toBe('https://reviewer.example.com/rpc');
  });

  it('falls back to host header when forwarded headers are absent', () => {
    expect(deriveRpcEndpoint({ host: 'localhost:5001' })).toBe(
      'https://localhost:5001/rpc',
    );
  });

  it('returns sensible default when nothing is provided', () => {
    expect(deriveRpcEndpoint({})).toBe('https://localhost/rpc');
  });
});
