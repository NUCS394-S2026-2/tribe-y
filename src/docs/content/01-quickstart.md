# Quickstart

Three calls take you from zero to a working review. No SDK, no auth.

In the snippets below, replace `https://reviewer.tne.ai` with the deployed host of your instance. When running the Firebase emulators locally, the Functions endpoint is `http://127.0.0.1:5001/<project-id>/us-central1/agentCard` and `…/reviewerRpc` (or, if you proxy via the React dev server, `http://localhost:5173/.well-known/agent.json` and `http://localhost:5173/rpc`).

## 1. Discover the agent

```bash
curl -s https://reviewer.tne.ai/.well-known/agent.json | jq
```

You will receive an [A2A agent card](/docs/agent-card) that lists the agent's name, version, the absolute URL of its JSON-RPC endpoint, and the three methods it serves. Everything else in this guide flows from the `endpoint` field of that document.

## 2. List the report types (free)

```bash
curl -s -X POST https://reviewer.tne.ai/rpc \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "listReportTypes",
    "params": {}
  }' | jq
```

The result is `{ reportTypes: ReportTypeDef[] }` — the 8 supported reports, each with `id`, `title`, `blurb`, `focus`, and 5 `dimensions`. See [Report types](/docs/report-types) for the full table.

## 3. Run a free sample review

```bash
curl -s -X POST https://reviewer.tne.ai/rpc \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "reviewSample",
    "params": {
      "code": "#include <cstring>\nint main(){ char b[8]; strcpy(b, \"too long for buffer\"); return 0; }",
      "reportType": "security"
    }
  }' | jq
```

You get back a full `SampleReportData` payload — scores, findings, code fixes, conclusion, and (best-effort) a `artifacts.pdfUrl` signed URL. The review is run by Gemini 2.5 Pro on a server-picked representative slice of the input.

## 4. Going further — paid full review

Switching `"method": "reviewSample"` to `"method": "reviewFull"` triggers the [x402 handshake](/docs/payment-handshake): the first call returns HTTP 402 with a payment quote; you sign a SOL transfer to the reviewer wallet on devnet and retry the same JSON-RPC body with an `X-Payment: <tx signature>` header.

A canonical reference client lives at `functions/scripts/a2a-client.ts`:

```bash
node --experimental-strip-types functions/scripts/a2a-client.ts
BASE_URL=http://127.0.0.1:5002 PAID=1 \
  node --experimental-strip-types functions/scripts/a2a-client.ts
```

That script exercises all three steps end-to-end and prints every response.
