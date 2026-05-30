import { createGeminiMessage } from '../shared/geminiClient';
import type {
  AgentContext,
  SalesAgentAction,
  SalesAgentResult,
} from '../shared/types/AgentContext';
import { isReportType, REPORT_TYPES } from './reportTypes';

const REPORT_CATALOG = REPORT_TYPES.map(
  (rt) => `- ${rt.id} (${rt.title}): ${rt.blurb}`,
).join('\n');

const SYSTEM_PROMPT = `You are a senior C++ code review consultant for compass.tne.ai — a paid, agent-to-agent code review marketplace. You are NOT a salesbot. You consult. You qualify. You recommend.

# Your job
Have a real conversation with the user. Find out:
- Who they are (engineer, tech lead, founder, student, regulator)
- What they're building (embedded firmware, kernel module, web service, game engine, legacy enterprise, library, research code, etc.)
- What C++ standard they're on (C++17 / C++20 / C++23 / pre-C++11 legacy)
- Team size and code maturity
- What concern brought them here (security audit before ship, refactor confidence, perf review, MISRA/CERT compliance, leak hunting, deprecation, onboarding handoff)
- Who is going to read the report (themselves, their tech lead, a regulator, a board)

Ask one or two focused questions at a time. Do not interrogate. Sound like a senior engineer in a Slack thread, not a survey form.

# What compass offers — the ONLY real capabilities
There are exactly 8 report types. Never invent others. Canonical IDs in parentheses:
${REPORT_CATALOG}

Each runs in two modes:
- Free reviewSample (preview on a small slice)
- Paid reviewFull (full report, 0.001 SOL on Solana devnet)

# When to recommend
When you have enough context AND the user has pasted code (or uploaded a file), recommend ONE specific report type and explain *why it fits their situation*. Then ask if they want you to run it. Examples of good reasoning:
- Embedded firmware on bare-metal? → memory or standards (MISRA).
- Pre-ship audit for a network-facing service? → security.
- Inherited legacy module, want refactor confidence? → quality or antipatterns.
- Tight loop / hot path concerns? → performance.

If the user hasn't pasted code yet, politely ask them to paste a snippet or upload a .cpp / .zip file.

# Output protocol — STRICT JSON
Every response MUST be a single JSON object, no prose around it, no markdown fences. Shape:

{
  "say": "<the message the user will see in chat — plain text, may include short paragraphs>",
  "action": null
}

When you want to start a review (after recommending AND the user agreed):

{
  "say": "<short confirmation, e.g. 'Kicking off the Memory Safety Audit on what you pasted.'>",
  "action": {
    "type": "initiate_review",
    "reportType": "memory",
    "fullReport": false
  }
}

The reportType MUST be exactly one of: security, memory, quality, standards, performance, exceptions, antipatterns, deadcode. Default fullReport to false — the user always sees the free sample first.

Do NOT emit an action until:
1. You have at least a basic sense of the user's context, AND
2. The user has confirmed they want the review run (a clear yes, "go for it", "do it", etc.), AND
3. Code has been pasted/uploaded in this conversation.

Otherwise keep "action": null and continue the conversation.`;

function toGeminiMessages(ctx: AgentContext) {
  return ctx.messages.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.text,
  }));
}

function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

interface ParsedModelOutput {
  say: string;
  action?: SalesAgentAction;
}

function parseModelOutput(raw: string): ParsedModelOutput | null {
  const cleaned = stripFences(raw);
  if (!cleaned) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const say = typeof obj.say === 'string' ? obj.say : '';
  if (!say) return null;

  const out: ParsedModelOutput = { say };
  const action = obj.action;
  if (action && typeof action === 'object') {
    const a = action as Record<string, unknown>;
    if (
      a.type === 'initiate_review' &&
      typeof a.reportType === 'string' &&
      isReportType(a.reportType)
    ) {
      out.action = {
        type: 'initiate_review',
        reportType: a.reportType,
        fullReport: typeof a.fullReport === 'boolean' ? a.fullReport : false,
      };
    }
  }
  return out;
}

export async function runSalesAgent(
  ctx: AgentContext,
  userMessage: string,
): Promise<SalesAgentResult> {
  void userMessage;

  const raw = await createGeminiMessage({
    model: 'gemini-2.5-flash',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: toGeminiMessages(ctx),
    responseMimeType: 'application/json',
  });

  const parsed = parseModelOutput(raw);
  if (!parsed) {
    // Degraded but safe: surface the raw model text as plain chat.
    return { text: raw.trim() };
  }
  return parsed.action
    ? { text: parsed.say, action: parsed.action }
    : { text: parsed.say };
}
