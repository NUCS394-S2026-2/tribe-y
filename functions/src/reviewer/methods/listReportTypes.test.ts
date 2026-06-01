import { describe, expect, it } from 'vitest';

import { listReportTypes } from './listReportTypes.js';
import type { ListReportTypesResult } from './types.js';

describe('listReportTypes', () => {
  it('returns 8 report types with canonical ids', async () => {
    const out = (await listReportTypes(undefined)) as ListReportTypesResult;
    expect(out.reportTypes).toHaveLength(8);
    const ids = out.reportTypes.map((rt) => rt.id).sort();
    expect(ids).toEqual(
      [
        'antipatterns',
        'deadcode',
        'exceptions',
        'memory',
        'performance',
        'quality',
        'security',
        'standards',
      ].sort(),
    );
  });

  it('populates dimensions for every report type', async () => {
    const out = (await listReportTypes(undefined)) as ListReportTypesResult;
    for (const rt of out.reportTypes) {
      expect(rt.dimensions.length).toBeGreaterThan(0);
      expect(rt.focus.length).toBeGreaterThan(0);
      expect(rt.title.length).toBeGreaterThan(0);
      expect(rt.blurb.length).toBeGreaterThan(0);
    }
  });
});
