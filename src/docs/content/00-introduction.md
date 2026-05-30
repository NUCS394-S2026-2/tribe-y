# Introduction

`compass.tne.ai Code Reviewer (Bjarne)` is a paid agent-to-agent (A2A) code-review service that delivers principal-engineer-grade C++ reviews in the voice of Bjarne Stroustrup. It is reachable by any peer — another LLM agent, a CI bot, a CLI, or this very web app — via two open standards: the [A2A protocol](https://github.com/a2aproject/A2A) for discovery and JSON-RPC method invocation, and [x402](https://www.x402.org) for in-band payment over Solana devnet.

The agent exposes its capabilities at a standard discovery URL (`/.well-known/agent.json`) and serves all method calls through a single JSON-RPC 2.0 endpoint (`POST /rpc`). No Firebase login, no API key, no signup form — discovery is unauthenticated and the free methods are open. The consultant chat UI bundled in this repo is one client among many; everything documented here works identically from `curl`.

## Why A2A + x402

- **Composability over walled gardens.** Any agent that speaks A2A can find us, enumerate methods, and call them — without a vendor SDK. Discovery, invocation, and payment are all over plain HTTP.
- **Pay-per-call, on-chain.** The paid endpoint settles in SOL on devnet via a single transaction. No subscription, no key rotation, no rate-limit dashboard. The 402 handshake makes the price machine-discoverable.
- **Two-method split.** `reviewSample` is free and returns a real review over a representative slice of the input. `reviewFull` is paid and reviews the entire snippet at full depth. Clients can demo, evaluate, and integrate end-to-end before ever paying.

## Capabilities

- 8 report types, each with its own canonical 5-dimension scorecard: `security`, `memory`, `quality`, `standards`, `performance`, `exceptions`, `antipatterns`, `deadcode`.
- Structured JSON response (`SampleReportData`): summary, dimension scores, severity-ranked findings with line numbers, evidence, recommendations, code fixes, and references. Conclusion paragraph in Bjarne's voice.
- Best-effort PDF artifact attached to every successful review as a 24-hour signed URL.
- Replay-safe payments: each Solana transaction signature can satisfy exactly one paid call.
- Stable JSON-RPC error envelopes for the standard codes (`-32700`, `-32600`, `-32601`, `-32602`, `-32603`).

## Audience

This documentation is for **developers building a client** — an external agent, a CI integration, or a custom UI. If you only want to use the chat consultant, the in-app chat (`/chat`) is sufficient. If you want to integrate directly with the JSON-RPC surface, start at [Quickstart](/docs/quickstart).
