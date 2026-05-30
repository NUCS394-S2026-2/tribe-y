# JSON-RPC surface

All agent invocations go through one endpoint:

```
POST /rpc
Content-Type: application/json
```

The wire format is [JSON-RPC 2.0](https://www.jsonrpc.org/specification). Every request envelope is:

```json
{ "jsonrpc": "2.0", "id": <string|number|null>, "method": "<name>", "params": <object> }
```

Every successful response is:

```json
{ "jsonrpc": "2.0", "id": <echoed>, "result": <method-specific> }
```

Errors come back as a standard error envelope (see below). The HTTP status is `200` for any well-formed JSON-RPC interaction — including most error envelopes — except for the x402 402 case on `reviewFull`, which returns HTTP 402 and a non-JSON-RPC quote body.

## Methods

### `listReportTypes`

- **Paid:** no
- **Params:** `{}` (any object is accepted; ignored)
- **Result:**

  ```ts
  { reportTypes: ReportTypeDef[] }
  ```

  See [Report types](/docs/report-types) for the `ReportTypeDef` shape.

### `reviewSample`

- **Paid:** no
- **Params:**

  ```ts
  {
    code: string; // non-empty C++ source
    reportType: ReportType; // one of the 8 ids; see Report types
  }
  ```

- **Result:** `SampleReportData` — see [Response shape](/docs/response-shape).
- **Behaviour:** The server picks a representative slice of `code` and runs the review on that slice. Same output schema as `reviewFull`, just narrower scope.

### `reviewFull`

- **Paid:** yes (x402 over Solana devnet)
- **Params:** identical to `reviewSample`.
- **Result:** `SampleReportData`, with `isFullReport: true`.
- **Payment:** without `X-Payment` the response is HTTP 402 + a quote document. See [Payment handshake](/docs/payment-handshake).

## Error envelope

```json
{
  "jsonrpc": "2.0",
  "id": <echoed or null>,
  "error": { "code": <int>, "message": "<string>" }
}
```

| Code     | Meaning          | When                                                                                                                       |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `-32700` | Parse error      | Request body was missing or not valid JSON. (See platform note below.)                                                     |
| `-32600` | Invalid Request  | JSON parsed but envelope shape was wrong (missing `jsonrpc: "2.0"`, missing `method`, etc.). Also returned for `GET /rpc`. |
| `-32601` | Method not found | `method` did not match `listReportTypes`, `reviewSample`, or `reviewFull`.                                                 |
| `-32602` | Invalid params   | Params failed validation — empty `code`, unknown `reportType`, etc.                                                        |
| `-32603` | Internal error   | Anything the server could not classify.                                                                                    |

The full list of recoverable reasons is on [Error codes](/docs/error-codes).

## Platform note on parse errors

Firebase Functions v2 applies its own JSON body-parser before any handler runs. If a client sends `Content-Type: application/json` with a malformed body, the runtime returns an HTML 400 page — the agent's handler never sees the request and cannot produce a `-32700` envelope. Real JSON-RPC clients always send valid JSON, so this case is academic. To exercise the `-32700` path explicitly (e.g. in a test), send the malformed body with `Content-Type: text/plain` and the handler will respond with `{ "jsonrpc": "2.0", "id": null, "error": { "code": -32700, "message": "Parse error" } }`.
