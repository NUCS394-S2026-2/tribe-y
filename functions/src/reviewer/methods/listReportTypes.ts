import { REPORT_TYPES } from '../reportTypes.js';
import type { ListReportTypesResult, MethodHandler } from './types.js';

/**
 * Free, read-only A2A method. Returns the full catalog of supported
 * report types. No params, no auth, no payment.
 */
export const listReportTypes: MethodHandler = (): ListReportTypesResult => {
  return { reportTypes: REPORT_TYPES };
};
