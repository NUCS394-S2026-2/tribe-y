import { describe, expect, it } from 'vitest';

import { buildAgentCard, deriveRpcEndpoint } from './agentCard.js';
import { REVIEW_FULL_PRICE_LAMPORTS, REVIEWER_WALLET_ADDRESS } from './wallet.js';

describe('buildAgentCard', () => {
  it('returns the expected shape', () => {
    const card = buildAgentCard('https://example.com/rpc');
    expect(card.name).toBe('compass.tne.ai Code Reviewer (Bjarne)');
    expect(card.version).toBe('0.1.0');
    expect(card.endpoint).toBe('https://example.com/rpc');
    expect(card.methods).toHaveLength(3);
  });

  it('advertises listReportTypes as free', () => {
    const card = buildAgentCard('https://example.com/rpc');
    const m = card.methods.find((x) => x.name === 'listReportTypes');
    expect(m).toBeDefined();
    expect(m?.paid).toBe(false);
  });

  it('advertises reviewSample as a free method', () => {
    const card = buildAgentCard('https://example.com/rpc');
    const m = card.methods.find((x) => x.name === 'reviewSample');
    expect(m).toBeDefined();
    expect(m?.paid).toBe(false);
    expect(m?.pricing).toBeUndefined();
  });

  it('advertises reviewFull as a paid method backed by solana-devnet', () => {
    const card = buildAgentCard('https://example.com/rpc');
    const m = card.methods.find((x) => x.name === 'reviewFull');
    expect(m).toBeDefined();
    expect(m?.paid).toBe(true);
    expect(m?.pricing?.network).toBe('solana-devnet');
    expect(m?.pricing?.currency).toBe('SOL_LAMPORTS');
    expect(m?.pricing?.recipient).toBe(REVIEWER_WALLET_ADDRESS);
    expect(m?.pricing?.amount).toBe(String(REVIEW_FULL_PRICE_LAMPORTS));
  });

  it('no longer advertises the legacy `review` method', () => {
    const card = buildAgentCard('https://example.com/rpc');
    expect(card.methods.find((x) => x.name === 'review')).toBeUndefined();
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

  it('prefers req.protocol over the localhost default when no forwarded headers exist', () => {
    expect(deriveRpcEndpoint({ host: 'reviewer.example.com' }, 'https')).toBe(
      'https://reviewer.example.com/rpc',
    );
  });

  it('defaults to http for localhost-style hosts (so emulators work)', () => {
    expect(deriveRpcEndpoint({ host: 'localhost:5001' })).toBe(
      'http://localhost:5001/rpc',
    );
    expect(deriveRpcEndpoint({ host: '127.0.0.1:5002' })).toBe(
      'http://127.0.0.1:5002/rpc',
    );
  });

  it('defaults to https for non-localhost hosts', () => {
    expect(deriveRpcEndpoint({ host: 'reviewer.example.com' })).toBe(
      'https://reviewer.example.com/rpc',
    );
  });

  it('returns sensible default when nothing is provided', () => {
    expect(deriveRpcEndpoint({})).toBe('http://localhost/rpc');
  });
});
