// TypeScript interfaces for JSON-RPC method input/output.

export type { ReportType, ReportTypeDef } from '../reportTypes.js';
import type { ReportTypeDef } from '../reportTypes.js';

/**
 * A JSON-RPC method handler. Receives the `params` object from the JSON-RPC
 * envelope and returns the `result` value (or throws to produce an error).
 *
 * Handlers do not see the raw HTTP request/response — they operate purely on
 * params and return a result. The dispatcher in `rpc.ts` is responsible for
 * shaping the JSON-RPC envelope around the return value.
 */
export type MethodHandler = (params: unknown) => Promise<unknown> | unknown;

/**
 * Output shape of the `listReportTypes` method.
 */
export interface ListReportTypesResult {
  reportTypes: readonly ReportTypeDef[];
}
