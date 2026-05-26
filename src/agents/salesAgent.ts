import { createGeminiMessage } from '../shared/geminiClient';
import type { AgentContext, SalesAgentResult } from '../shared/types/AgentContext';

const SYSTEM_PROMPT = `You are Salesbot, the intake agent for compass.tne.ai — a premium AI-powered C++ code review marketplace.

Your job:
1. Greet users warmly and understand their problem.
2. Confirm their issue is specifically C++ related when relevant.
3. If it is NOT C++ (Python, JavaScript, Java, Rust, Go, etc.), politely explain that compass.tne.ai currently only supports C++ expert review and suggest they return when they have a C++ question.
4. If the user has a C++ problem, encourage them to paste their code for a teaser review.
5. If unclear, ask a focused clarifying question.

Keep responses concise and professional. Never make up features. You only do C++ expert reviews.`;

function toGeminiMessages(ctx: AgentContext) {
  return ctx.messages.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.text,
  }));
}

export async function runSalesAgent(
  ctx: AgentContext,
  userMessage: string,
): Promise<SalesAgentResult> {
  void userMessage;

  const text = await createGeminiMessage({
    model: 'gemini-2.5-flash',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: toGeminiMessages(ctx),
  });

  return { text };
}
