import { describe, expect, it } from 'vitest';

import {
  dispatchRpc,
  JSON_RPC_ERRORS,
  parseErrorEnvelope,
  type JsonRpcErrorEnvelope,
  type JsonRpcSuccess,
} from './rpc.js';

describe('dispatchRpc', () => {
  it('returns INVALID_REQUEST for non-object input', async () => {
    const r = (await dispatchRpc(null)) as JsonRpcErrorEnvelope;
    expect(r.error.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
    expect(r.id).toBeNull();
  });

  it('returns INVALID_REQUEST for envelope missing jsonrpc: "2.0"', async () => {
    const r = (await dispatchRpc({
      id: 7,
      method: 'listReportTypes',
    })) as JsonRpcErrorEnvelope;
    expect(r.error.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
  });

  it('returns INVALID_REQUEST for envelope missing method', async () => {
    const r = (await dispatchRpc({
      jsonrpc: '2.0',
      id: 7,
    })) as JsonRpcErrorEnvelope;
    expect(r.error.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
  });

  it('returns METHOD_NOT_FOUND for unknown method with default registry', async () => {
    // The default (test) registry only has listReportTypes — `review` needs
    // an API key supplied at construction time via `buildMethodHandlers`.
    const r = (await dispatchRpc({
      jsonrpc: '2.0',
      id: 'abc',
      method: 'definitelyDoesNotExist',
    })) as JsonRpcErrorEnvelope;
    expect(r.error.code).toBe(JSON_RPC_ERRORS.METHOD_NOT_FOUND);
    expect(r.id).toBe('abc');
  });

  it('listReportTypes happy path returns 8 report types', async () => {
    const r = (await dispatchRpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'listReportTypes',
    })) as JsonRpcSuccess;
    expect(r.jsonrpc).toBe('2.0');
    expect(r.id).toBe(1);
    const result = r.result as { reportTypes: { id: string }[] };
    expect(result.reportTypes).toHaveLength(8);
  });

  it('maps InvalidParamsError to INVALID_PARAMS', async () => {
    const handlers = {
      bad: () => {
        const e = new Error('nope');
        e.name = 'InvalidParamsError';
        throw e;
      },
    };
    const r = (await dispatchRpc(
      { jsonrpc: '2.0', id: 2, method: 'bad' },
      handlers,
    )) as JsonRpcErrorEnvelope;
    expect(r.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
  });

  it('maps generic throw to INTERNAL_ERROR', async () => {
    const handlers = {
      boom: () => {
        throw new Error('boom');
      },
    };
    const r = (await dispatchRpc(
      { jsonrpc: '2.0', id: 3, method: 'boom' },
      handlers,
    )) as JsonRpcErrorEnvelope;
    expect(r.error.code).toBe(JSON_RPC_ERRORS.INTERNAL_ERROR);
    expect(r.error.message).toBe('boom');
  });
});

describe('parseErrorEnvelope', () => {
  it('returns -32700 PARSE_ERROR with null id', () => {
    const r = parseErrorEnvelope();
    expect(r.error.code).toBe(JSON_RPC_ERRORS.PARSE_ERROR);
    expect(r.id).toBeNull();
    expect(r.jsonrpc).toBe('2.0');
  });
});
