import { RefObject } from 'react';

import ReportTypeSelector from '../../components/ReportTypeSelector';
import styles from '../CompassChat.module.css';
import { AnalyzingIndicator } from './AnalyzingIndicator';
import { AssistantMessageRow } from './AssistantMessageRow';
import { ChatTranscript } from './ChatTranscript';
import { CodeInputCard } from './CodeInputCard';
import { ExpertReviewCard } from './ExpertReviewCard';
import { PaymentProcessingIndicator } from './PaymentProcessingIndicator';
import type { CompassChatDisplayMessage, CompassChatStage } from './stages';
import { VaultReceiptCard } from './VaultReceiptCard';
import type { PaymentRequestSummary } from './X402PaymentCard';
import { X402PaymentCard } from './X402PaymentCard';

interface CompassChatMessageFeedProps {
  stage: CompassChatStage;
  showWelcome: boolean;
  displayMessages: CompassChatDisplayMessage[];
  botLoading: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  snippet: string;
  onSnippetChange: (value: string) => void;
  onAnalyze: () => void;
  onReportTypeConfirm: (reportTypeId: string) => void;
  onReportTypeNotSure: () => void;
  onClearSnippet: () => void;
  teaserReview: string | null;
  fullReview: string | null;
  onUnlockFullReview: () => void;
  paymentRequest: PaymentRequestSummary | null;
  isPaying: boolean;
  onPay: () => void;
  txnId: string | null;
  paymentAmount: string | undefined;
  confirmedAt: string | null;
  onViewFullReview: () => void;
}

export function CompassChatMessageFeed({
  stage,
  showWelcome,
  displayMessages,
  botLoading,
  bottomRef,
  snippet,
  onSnippetChange,
  onAnalyze,
  onReportTypeConfirm,
  onReportTypeNotSure,
  onClearSnippet,
  teaserReview,
  fullReview,
  onUnlockFullReview,
  paymentRequest,
  isPaying,
  onPay,
  txnId,
  paymentAmount,
  confirmedAt,
  onViewFullReview,
}: CompassChatMessageFeedProps) {
  const showExpertReview =
    (stage === 'teaser' ||
      stage === 'payment' ||
      stage === 'paying' ||
      stage === 'payment-failed' ||
      stage === 'receipt' ||
      stage === 'full-review') &&
    !!teaserReview;

  const showPaymentCard =
    (stage === 'payment' || stage === 'paying') && paymentRequest !== null;

  const showReceipt = (stage === 'receipt' || stage === 'full-review') && txnId !== null;

  return (
    <div className={styles.messages} role="log" aria-live="polite">
      <ChatTranscript
        showWelcome={showWelcome}
        messages={displayMessages}
        botLoading={botLoading}
      />

      {stage === 'code-input' && (
        <CodeInputCard
          snippet={snippet}
          onSnippetChange={onSnippetChange}
          onAnalyze={onAnalyze}
          onClear={onClearSnippet}
        />
      )}

      {stage === 'report-type' && (
        <AssistantMessageRow>
          <ReportTypeSelector
            onSelect={onReportTypeConfirm}
            onSelectNotSure={onReportTypeNotSure}
          />
        </AssistantMessageRow>
      )}

      {stage === 'analyzing' && <AnalyzingIndicator />}

      {showExpertReview && teaserReview && (
        <ExpertReviewCard
          stage={stage}
          teaserReview={teaserReview}
          fullReview={fullReview}
          onUnlockFullReview={onUnlockFullReview}
        />
      )}

      {showPaymentCard && paymentRequest && (
        <X402PaymentCard payment={paymentRequest} isPaying={isPaying} onPay={onPay} />
      )}

      {stage === 'paying' && <PaymentProcessingIndicator />}

      {stage === 'payment-failed' && (
        <p
          role="alert"
          style={{ color: 'var(--color-error, #e53e3e)', margin: '1rem 0' }}
        >
          Payment was received but the full review could not be loaded. Please contact
          support with your transaction ID.
        </p>
      )}

      {showReceipt && txnId && (
        <VaultReceiptCard
          stage={stage}
          txnId={txnId}
          amount={paymentAmount}
          confirmedAt={confirmedAt}
          onViewFullReview={onViewFullReview}
          onSavePdf={() => window.print()}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
