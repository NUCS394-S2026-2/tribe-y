import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CodeReviewAuthError, runCodeReviewTeaser } from '../../agents/codeReviewAgent';
import { runSalesAgent } from '../../agents/salesAgent';
import { CODE_SNIPPET_MAX_CHARS } from '../../shared/codeSnippetLimits';
import { auth } from '../../shared/firebase';
import type {
  ChatMessage,
  ChatMessageKind,
  ChatSession,
} from '../../shared/types/ChatSession';
import { routeMessage } from './routeMessage';

const GREETING_TEXT =
  "Hi! I'm Salesbot for compass.tne.ai. We connect you with our C++ Expert agent for premium, annotated code reviews. What C++ problem are you working on today?";

function createMessage(
  role: ChatMessage['role'],
  text: string,
  kind: ChatMessageKind,
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    kind,
    createdAt: Date.now(),
  };
}

function createInitialSession(): ChatSession {
  return {
    messages: [createMessage('assistant', GREETING_TEXT, 'sales')],
    mode: 'qualifying',
    activeReviewId: null,
    isLoading: false,
  };
}

interface UseChatOrchestratorReturn {
  session: ChatSession;
  sendMessage: (text: string) => Promise<void>;
  goToPayment: () => void;
}

export function useChatOrchestrator(): UseChatOrchestratorReturn {
  const navigate = useNavigate();
  const [session, setSession] = useState<ChatSession>(createInitialSession);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const current = sessionRef.current;
    if (current.isLoading || current.mode === 'analyzing') {
      return;
    }

    const messagesWithUser: ChatMessage[] = [
      ...current.messages,
      createMessage('user', trimmed, 'sales'),
    ];

    setSession({
      ...current,
      messages: messagesWithUser,
      isLoading: true,
    });

    const route = routeMessage(
      {
        messages: messagesWithUser,
        mode: 'qualifying',
        activeReviewId: null,
        isLoading: true,
      },
      trimmed,
    );

    try {
      await auth.authStateReady();
      const uid = auth.currentUser?.uid ?? null;
      const ctx = { messages: messagesWithUser, uid };

      if (route === 'sales') {
        const result = await runSalesAgent(ctx, trimmed);
        setSession((prev) => ({
          ...prev,
          messages: [
            ...messagesWithUser,
            createMessage('assistant', result.text, 'sales'),
          ],
          mode: 'qualifying',
          isLoading: false,
        }));
        return;
      }

      setSession((prev) => ({
        ...prev,
        messages: messagesWithUser,
        mode: 'analyzing',
        isLoading: true,
      }));

      const snippet = trimmed.slice(0, CODE_SNIPPET_MAX_CHARS);
      const result = await runCodeReviewTeaser(ctx, snippet);

      setSession((prev) => ({
        ...prev,
        messages: [
          ...messagesWithUser,
          createMessage('assistant', result.teaserReview, 'teaser'),
        ],
        mode: 'teaser',
        activeReviewId: result.reviewId,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Chat orchestrator error:', err);
      const errorText =
        err instanceof CodeReviewAuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sorry, something went wrong. Please try again.';

      setSession((prev) => ({
        ...prev,
        messages: [...messagesWithUser, createMessage('assistant', errorText, 'error')],
        mode: 'qualifying',
        isLoading: false,
      }));
    }
  }, []);

  const goToPayment = useCallback(() => {
    if (!session.activeReviewId) return;
    navigate(`/payment?reviewId=${encodeURIComponent(session.activeReviewId)}`);
  }, [navigate, session.activeReviewId]);

  return { session, sendMessage, goToPayment };
}
