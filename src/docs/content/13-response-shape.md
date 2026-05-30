# Response shape

Both `reviewSample` and `reviewFull` return the same TypeScript-typed payload, `SampleReportData`. The only behavioural difference is that `reviewFull` sets `isFullReport: true` and reviews the whole snippet rather than a slice.

```ts
interface SampleReportData {
  reportType: ReportType;
  reportTitle: string;
  slice: SampleReportSlice;
  summary: string;
  findings: SampleReportFinding[];
  conclusion: string;
  scores: SampleReportScores;
  generatedAt: number; // ms epoch
  isFullReport?: boolean;
  artifacts?: {
    pdfUrl: string; // 24h signed v4 GCS URL
    pdfExpiresAt: string; // ISO 8601
    pdfSha256: string;
  };
}

interface SampleReportSlice {
  startLine: number;
  endLine: number;
  reason: string;
  code: string;
}

interface SampleReportFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  title: string;
  detail: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
  codeFix?: string;
  references?: string[];
}

interface SampleReportScores {
  overall: number; // 1..10
  dimensions: Array<{ label: string; score: number; note?: string }>;
}
```

## Example

```json
{
  "reportType": "memory",
  "reportTitle": "Memory Safety Audit",
  "slice": {
    "startLine": 4,
    "endLine": 14,
    "reason": "Constructor allocates with new[] and the class has no destructor — the canonical place to look for RAII violations.",
    "code": "struct Item { char* name; ... }"
  },
  "summary": "The Item type owns a heap-allocated name buffer but never frees it; copying or moving the value silently shares the pointer.",
  "findings": [
    {
      "severity": "critical",
      "line": 8,
      "title": "Missing destructor leaks `name`",
      "detail": "Item allocates name via new[] in the ctor with no matching delete[].",
      "impact": "Every Item instance leaks its name buffer on destruction.",
      "evidence": "name = new char[strlen(n) + 1];",
      "recommendation": "Replace the raw owning pointer with std::string, or follow the rule of five.",
      "codeFix": "std::string name;\nItem(std::string n, int i) : name(std::move(n)), id(i) {}",
      "references": ["CppCoreGuidelines R.1", "CERT MEM31-C"]
    }
  ],
  "conclusion": "Use std::string. RAII is not optional in 2025.",
  "scores": {
    "overall": 3,
    "dimensions": [
      {
        "label": "Resource management",
        "score": 2,
        "note": "Manual new[] with no delete[]"
      },
      { "label": "Ownership semantics", "score": 3 },
      { "label": "Lifetime safety", "score": 3 },
      { "label": "Exception safety", "score": 4 },
      { "label": "Type safety", "score": 4 }
    ]
  },
  "generatedAt": 1748550000000,
  "isFullReport": false,
  "artifacts": {
    "pdfUrl": "https://storage.googleapis.com/.../report.pdf?...",
    "pdfExpiresAt": "2026-05-30T17:00:00.000Z",
    "pdfSha256": "8d3f…"
  }
}
```

## Notes

- `scores.dimensions` always has exactly 5 entries; the `label` for each entry comes from the matching `ReportTypeDef.dimensions` array. You can join by index.
- `findings` are sorted by severity, descending. `critical` and `high` are the ones to act on first.
- `slice.code` echoes the exact substring the model reviewed. For `reviewSample` this is the slice picker's output; for `reviewFull` it is the entire input.
- `artifacts` is **best-effort**. When PDF rendering or upload fails the JSON response is still authoritative — the field is simply omitted and a warning is logged server-side. The signed URL is a [v4 signed Google Cloud Storage URL](https://cloud.google.com/storage/docs/access-control/signed-urls) valid for ~24 hours from generation; download promptly and re-host if you need longer retention.
