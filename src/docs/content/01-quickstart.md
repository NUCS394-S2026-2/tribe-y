# Quickstart

Three calls take you from zero to a working review. No SDK, no auth, no Firebase.

Set the agent's base URL once and reuse it everywhere:

```bash
export BASE_URL=https://reviewer.tne.ai
```

(See [Running against a local instance](#running-against-a-local-instance) at the bottom if you're spinning the agent up yourself.)

## 1. Discover the agent

```bash
curl -s "$BASE_URL/.well-known/agent.json" | jq
```

Returns an [A2A agent card](/docs/agent-card) listing the agent's name, version, the absolute URL of its JSON-RPC endpoint, and the three methods it serves. Every other call in this guide flows from the `endpoint` field of that document.

## 2. List the report types (free)

```bash
curl -s -X POST "$BASE_URL/rpc" \
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
curl -s -X POST "$BASE_URL/rpc" \
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

You get a `SampleReportData` payload — scores, findings, code fixes, conclusion, and a best-effort `artifacts.pdfUrl` signed URL. Gemini 2.5 Pro reviews a server-picked representative slice of the input.

## 4. Going further — paid full review

Swap `"method": "reviewSample"` for `"method": "reviewFull"`. The first call returns HTTP 402 with a payment quote; you sign a SOL transfer to the reviewer wallet on devnet and retry the same JSON-RPC body with an `X-Payment: <tx signature>` header. Full walkthrough: [Payment handshake](/docs/payment-handshake).

## Reference client

`functions/scripts/a2a-client.ts` in the repo is a runnable Node example that exercises every step and prints each response:

```bash
BASE_URL=$BASE_URL node --experimental-strip-types functions/scripts/a2a-client.ts
BASE_URL=$BASE_URL PAID=1 node --experimental-strip-types functions/scripts/a2a-client.ts
```

## Running against a local instance

Only relevant if you're cloning this repo and running the agent yourself — integrators using a deployed instance can skip this section.

The Firebase Hosting emulator caps function rewrites at 60s, which is too tight for a paid review. Hit the Functions emulator directly:

```bash
export BASE_URL=http://127.0.0.1:5001/<your-firebase-project-id>/us-central1
```

Then the curl commands above target `$BASE_URL/.well-known/agent.json` → the `agentCard` function and `$BASE_URL/rpc` → the `reviewerRpc` function. Same JSON in, same JSON out.
