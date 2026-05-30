# Agent card

The A2A discovery document lives at:

```
GET /.well-known/agent.json
```

Discovery is **unauthenticated** by design — the A2A protocol requires that peers can fetch the card without prior credentials in order to find out what the agent does and how to pay for it. Paid methods listed in the card are still gated by the x402 handshake at `/rpc`; only the catalog itself is open.

## Document shape

```json
{
  "name": "compass.tne.ai Code Reviewer (Bjarne)",
  "description": "Principal-engineer-grade C++ code review by an agent in the voice of Bjarne Stroustrup.",
  "version": "0.1.0",
  "endpoint": "https://reviewer.tne.ai/rpc",
  "methods": [
    {
      "name": "listReportTypes",
      "description": "Returns the catalog of supported report types.",
      "params": {},
      "result": "{ reportTypes: ReportTypeDef[] }",
      "paid": false
    },
    {
      "name": "reviewSample",
      "description": "Free sample review on a representative slice. No payment required.",
      "params": "{ code: string, reportType: ReportType }",
      "result": "SampleReportData",
      "paid": false
    },
    {
      "name": "reviewFull",
      "description": "Full C++ review on the entire submitted snippet. Paid: x402 over Solana devnet…",
      "params": "{ code: string, reportType: ReportType }",
      "result": "SampleReportData",
      "paid": true,
      "pricing": {
        "amount": "1000000",
        "currency": "SOL_LAMPORTS",
        "network": "solana-devnet",
        "recipient": "2vCfh5Cia6iwb7uBfrWeXaG6UtvTzV6kzzH5XCfAVmZp"
      }
    }
  ]
}
```

## Field reference

| Field                   | Meaning                                                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                  | Human-readable identifier of the agent. Stable across versions.                                                                                                                                                |
| `description`           | One-line capability summary, suitable for surfacing in an agent picker.                                                                                                                                        |
| `version`               | SemVer of the agent's protocol surface. Bumped on breaking changes.                                                                                                                                            |
| `endpoint`              | Absolute URL of the JSON-RPC 2.0 endpoint (always `<host>/rpc`). Always absolute so peer agents do not have to reconstruct it.                                                                                 |
| `methods`               | Array of method descriptors.                                                                                                                                                                                   |
| `methods[].name`        | Canonical method name. Pass as the JSON-RPC `method` field.                                                                                                                                                    |
| `methods[].description` | Free-text description of the method.                                                                                                                                                                           |
| `methods[].params`      | Either the empty object `{}` or a TypeScript-style signature string of the params schema.                                                                                                                      |
| `methods[].result`      | TypeScript-style type name of the success result shape.                                                                                                                                                        |
| `methods[].paid`        | `true` for methods that require an x402 payment.                                                                                                                                                               |
| `methods[].pricing`     | Present iff `paid: true`. Carries the canonical amount, currency, network, and destination wallet. Clients should use this to _budget_ the call but the _authoritative_ quote is the 402 response from `/rpc`. |

## Endpoint derivation

The `endpoint` URL is built from the incoming request headers. The server honors `x-forwarded-proto` and `x-forwarded-host` so the URL we advertise matches whatever proxy or hosting layer fronts the agent (Firebase Hosting in production, the Functions emulator locally). Clients should always read the advertised `endpoint` rather than hard-coding `/rpc`.

## Further reading

- A2A protocol spec: [github.com/a2aproject/A2A](https://github.com/a2aproject/A2A)
- JSON-RPC details: [JSON-RPC](/docs/json-rpc)
