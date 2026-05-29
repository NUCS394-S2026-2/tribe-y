#!/usr/bin/env -S node --experimental-strip-types
/**
 * Minimal external A2A client demo for the compass.tne.ai reviewer agent.
 *
 * Demonstrates the full discovery + invocation flow that any third-party
 * agent (CLI, CI bot, another LLM agent) would use to call our service.
 * No Firebase auth, no UI — pure protocol.
 *
 * Usage:
 *   node --experimental-strip-types functions/scripts/a2a-client.ts
 *   BASE_URL=http://127.0.0.1:5002 node ... a2a-client.ts            # emulator
 *   BASE_URL=https://reviewer.tne.ai node ... a2a-client.ts          # prod
 *   BASE_URL=...                 REPORT_TYPE=performance node ... a2a-client.ts
 *
 * Steps:
 *   1. GET <BASE_URL>/.well-known/agent.json    → discover endpoint + methods.
 *   2. POST <rpc-endpoint> {listReportTypes}    → enumerate the catalog.
 *   3. POST <rpc-endpoint> {review, ...}        → invoke the agent.
 *
 * NOTE: Today the `review` method is NOT yet gated by x402. When PR 6 lands
 * this script will need to handle HTTP 402 + Solana wallet signing.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5002';
const REPORT_TYPE = process.env.REPORT_TYPE ?? 'memory';

const SAMPLE_CPP = `#include <vector>
#include <string>
#include <cstring>

struct Item {
  char* name;
  int id;
  Item(const char* n, int i) {
    name = new char[strlen(n) + 1];
    strcpy(name, n);
    id = i;
  }
  // No destructor → leaks 'name'.
  // No rule-of-five → copying/moving breaks ownership.
};

int main() {
  std::vector<Item> items;
  for (int i = 0; i < 5; ++i) {
    items.push_back(Item("widget", i));
  }
  // Returning pointer to vector element — dangling on resize.
  Item* leaked = &items[0];
  return leaked->id;
}`;

interface AgentCard {
  name: string;
  endpoint: string;
  methods: Array<{ name: string; paid: boolean }>;
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: T;
  error?: { code: number; message: string };
}

async function jsonRpc<T>(
  endpoint: string,
  method: string,
  params?: unknown,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const env = (await res.json()) as JsonRpcResponse<T>;
  if (env.error) {
    throw new Error(`JSON-RPC ${env.error.code}: ${env.error.message}`);
  }
  return env.result as T;
}

async function main() {
  console.log(`[discover] GET ${BASE_URL}/.well-known/agent.json`);
  const cardRes = await fetch(`${BASE_URL}/.well-known/agent.json`);
  if (!cardRes.ok) throw new Error(`Agent card unavailable: ${cardRes.status}`);
  const card = (await cardRes.json()) as AgentCard;
  console.log(`         ↳ ${card.name}`);
  console.log(`         ↳ endpoint: ${card.endpoint}`);
  console.log(`         ↳ methods : ${card.methods.map((m) => m.name).join(', ')}`);

  // The card may advertise an https endpoint when we're talking to a local
  // emulator. Fall back to the BASE_URL if the card endpoint is unreachable.
  const rpcEndpoint = card.endpoint.startsWith('https://127.0.0.1')
    ? `${BASE_URL}/rpc`
    : card.endpoint;

  console.log(`\n[list]     POST ${rpcEndpoint} {listReportTypes}`);
  const list = await jsonRpc<{ reportTypes: Array<{ id: string; title: string }> }>(
    rpcEndpoint,
    'listReportTypes',
  );
  console.log(`         ↳ ${list.reportTypes.length} report types`);
  for (const rt of list.reportTypes) {
    console.log(`           - ${rt.id.padEnd(14)} ${rt.title}`);
  }

  console.log(
    `\n[review]   POST ${rpcEndpoint} {review, reportType=${REPORT_TYPE}, code=...}`,
  );
  const start = Date.now();
  const report = await jsonRpc<{
    reportTitle: string;
    scores: { overall: number };
    findings: unknown[];
    summary: string;
  }>(rpcEndpoint, 'review', { code: SAMPLE_CPP, reportType: REPORT_TYPE });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`         ↳ ${report.reportTitle} (${elapsed}s)`);
  console.log(`         ↳ overall score: ${report.scores.overall}/10`);
  console.log(`         ↳ ${report.findings.length} findings`);
  console.log(`         ↳ summary: ${report.summary.slice(0, 180)}…`);
}

main().catch((e) => {
  console.error('a2a-client failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
