import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CodeReviewAuthError,
  createPendingReview,
  runSampleReport,
} from '../../agents/codeReviewAgent';
import { type ReportType } from '../../agents/reportTypes';
import { runSalesAgent } from '../../agents/salesAgent';
import { CODE_SNIPPET_MAX_CHARS } from '../../shared/codeSnippetLimits';
import { auth } from '../../shared/firebase';
import type {
  ChatMessage,
  ChatMessageKind,
  ChatSession,
  SampleReportData,
} from '../../shared/types/ChatSession';
import { routeMessage } from './routeMessage';

const GREETING_TEXT =
  "Hi! I'm Salesbot for compass.tne.ai. We connect you with our C++ Expert agent for premium, annotated code reviews. What C++ problem are you working on today?";

function createMessage(
  role: ChatMessage['role'],
  text: string,
  kind: ChatMessageKind,
  extras?: Partial<ChatMessage>,
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    kind,
    createdAt: Date.now(),
    ...extras,
  };
}

function createInitialSession(): ChatSession {
  return {
    messages: [createMessage('assistant', GREETING_TEXT, 'sales')],
    mode: 'qualifying',
    activeReviewId: null,
    isLoading: false,
    uploadedFile: null,
    pendingCode: null,
    selectedReportType: null,
  };
}

interface UseChatOrchestratorReturn {
  session: ChatSession;
  sendMessage: (text: string) => Promise<void>;
  goToPayment: () => void;
  handleFileUpload: (fileName: string, content: string) => Promise<void>;
  selectReportType: (reportType: ReportType) => Promise<void>;
  generateFullReportPreview: () => Promise<void>;
}

export function useChatOrchestrator(): UseChatOrchestratorReturn {
  const navigate = useNavigate();
  const [session, setSession] = useState<ChatSession>(createInitialSession);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const startReportSelection = useCallback(
    async (snippet: string, fileLabel: string | null) => {
      const reviewId = await createPendingReview(snippet);
      const intro = fileLabel
        ? `Got your file (${fileLabel}). Which report do you want me to preview?`
        : 'Got your code. Which report do you want me to preview?';

      setSession((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          createMessage('assistant', intro, 'sales'),
          createMessage('assistant', '', 'report-type-selector', {
            reportTypeSelector: { reviewId, selectedReportType: null },
          }),
        ],
        mode: 'selecting',
        activeReviewId: reviewId,
        pendingCode: snippet,
        selectedReportType: null,
        isLoading: false,
      }));
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
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
          uploadedFile: null,
          pendingCode: null,
          selectedReportType: null,
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

        const snippet = trimmed.slice(0, CODE_SNIPPET_MAX_CHARS);
        setSession((prev) => ({
          ...prev,
          messages: messagesWithUser,
          mode: 'analyzing',
          isLoading: true,
        }));
        await startReportSelection(snippet, null);
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
    },
    [startReportSelection],
  );

  const handleFileUpload = useCallback(
    async (fileName: string, content: string) => {
      const current = sessionRef.current;

      try {
        await auth.authStateReady();
        const isCppOrZip =
          fileName.toLowerCase().endsWith('.cpp') ||
          fileName.toLowerCase().endsWith('.zip');

        if (isCppOrZip) {
          setSession((prev) => ({
            ...prev,
            mode: 'analyzing',
            isLoading: true,
            uploadedFile: { name: fileName, content },
          }));

          const snippet = content.slice(0, CODE_SNIPPET_MAX_CHARS);
          await startReportSelection(snippet, fileName);
        } else {
          setSession((prev) => ({
            ...prev,
            uploadedFile: { name: fileName, content },
          }));
        }
      } catch (err) {
        console.error('File upload error:', err);
        const errorText =
          err instanceof Error ? err.message : 'Error processing file upload.';

        setSession((prev) => ({
          ...prev,
          messages: [...current.messages, createMessage('assistant', errorText, 'error')],
          mode: 'qualifying',
          isLoading: false,
        }));
      }
    },
    [startReportSelection],
  );

  const selectReportType = useCallback(async (reportType: ReportType) => {
    const current = sessionRef.current;
    if (!current.activeReviewId || !current.pendingCode) return;
    if (current.isLoading) return;

    setSession((prev) => ({
      ...prev,
      isLoading: true,
      mode: 'analyzing',
      selectedReportType: reportType,
      messages: prev.messages.map((m) =>
        m.kind === 'report-type-selector' && m.reportTypeSelector
          ? {
              ...m,
              reportTypeSelector: {
                ...m.reportTypeSelector,
                selectedReportType: reportType,
              },
            }
          : m,
      ),
    }));

    try {
      const data: SampleReportData = await runSampleReport({
        reviewId: current.activeReviewId,
        snippet: current.pendingCode,
        reportType,
      });

      setSession((prev) => {
        const withoutPrevSample = prev.messages.filter((m) => m.kind !== 'sample-report');
        const confidenceText = `Benchmark confidence: ${data.benchmarkConfidence.scorePercent}% (${data.benchmarkConfidence.source}).`;
        return {
          ...prev,
          messages: [
            ...withoutPrevSample,
            createMessage('assistant', confidenceText, 'sample-report', {
              sampleReport: data,
            }),
          ],
          mode: 'sample',
          isLoading: false,
        };
      });
    } catch (err) {
      console.error('Sample report failed:', err);
      const errorText =
        err instanceof Error
          ? err.message
          : 'Could not generate the sample report. Please try another type.';
      setSession((prev) => ({
        ...prev,
        messages: [...prev.messages, createMessage('assistant', errorText, 'error')],
        isLoading: false,
        mode: 'selecting',
      }));
    }
  }, []);

  const generateFullReportPreview = useCallback(async () => {
    const current = sessionRef.current;
    if (
      !current.activeReviewId ||
      !current.pendingCode ||
      !current.selectedReportType ||
      current.isLoading
    ) {
      return;
    }
    const reportType = current.selectedReportType;

    setSession((prev) => ({
      ...prev,
      isLoading: true,
      mode: 'analyzing',
      messages: [
        ...prev.messages,
        createMessage(
          'assistant',
          'Generating the full report — this bypasses payment for testing.',
          'sales',
        ),
      ],
    }));

    try {
      const data: SampleReportData = await runSampleReport({
        reviewId: current.activeReviewId,
        snippet: current.pendingCode,
        reportType,
        fullReport: true,
      });

      setSession((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          createMessage(
            'assistant',
            `Benchmark confidence: ${data.benchmarkConfidence.scorePercent}% (${data.benchmarkConfidence.source}).`,
            'sample-report',
            { sampleReport: data },
          ),
        ],
        mode: 'sample',
        isLoading: false,
      }));
    } catch (err) {
      console.error('Full report preview failed:', err);
      const errorText =
        err instanceof Error
          ? err.message
          : 'Could not generate the full report preview.';
      setSession((prev) => ({
        ...prev,
        messages: [...prev.messages, createMessage('assistant', errorText, 'error')],
        isLoading: false,
        mode: 'sample',
      }));
    }
  }, []);

  const goToPayment = useCallback(() => {
    const current = sessionRef.current;
    if (!current.activeReviewId) return;

    const params = new URLSearchParams({ reviewId: current.activeReviewId });
    if (current.selectedReportType) {
      params.set('reportType', current.selectedReportType);
    }

    const state = current.uploadedFile
      ? { uploadedFile: current.uploadedFile }
      : undefined;

    navigate(`/payment?${params.toString()}`, { state });
  }, [navigate]);

  return {
    session,
    sendMessage,
    goToPayment,
    handleFileUpload,
    selectReportType,
    generateFullReportPreview,
  };
}
