import { useCallback, useState } from 'react';

import { claude } from '../shared/claude';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

interface SalesbotState {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  intentVerified: boolean;
  isLoading: boolean;
}

const SYSTEM_PROMPT = `You are Salesbot, the intake agent for compass.tne.ai — a premium AI-powered C++ code review marketplace.

Your job:
1. Greet users warmly and understand their problem.
2. Confirm their issue is specifically C++ related.
3. If it is C++, tell them you can help and that they should proceed to paste their code. End your message with the exact token: [INTENT_VERIFIED]
4. If it is NOT C++ (Python, JavaScript, Java, Rust, Go, etc.), politely explain that compass.tne.ai currently only supports C++ expert review and suggest they return when they have a C++ question.
5. If unclear, ask a focused clarifying question.

Keep responses concise and professional. Never make up features. You only do C++ expert reviews.`;

const GREETING: ChatMessage = {
  role: 'bot',
  content:
    "Hi! I'm Salesbot for compass.tne.ai. We connect you with our C++ Expert agent for premium, annotated code reviews. What C++ problem are you working on today?",
};

export function useSalesbot(): SalesbotState {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [intentVerified, setIntentVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: 'user', content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const response = await claude.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: updatedMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        });

        const raw = response.content[0].type === 'text' ? response.content[0].text : '';
        const verified = raw.includes('[INTENT_VERIFIED]');
        const clean = raw.replace('[INTENT_VERIFIED]', '').trim();

        const botMsg: ChatMessage = { role: 'bot', content: clean };
        setMessages([...updatedMessages, botMsg]);

        if (verified) setIntentVerified(true);
      } catch (err) {
        const errMsg: ChatMessage = {
          role: 'bot',
          content: 'Sorry, I ran into an issue. Please try again.',
        };
        setMessages([...updatedMessages, errMsg]);
        console.error('Salesbot error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  return { messages, sendMessage, intentVerified, isLoading };
}
