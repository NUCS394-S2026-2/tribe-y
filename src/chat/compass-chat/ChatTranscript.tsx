import React from 'react';

import { type ReportType } from '../../agents/reportTypes';
import type { ChatMessage } from '../../shared/types/ChatSession';
import styles from '../CompassChat.module.css';
import { BotTypingIndicator } from './BotTypingIndicator';
import { ExpertReviewCard } from './ExpertReviewCard';
import { ReportTypeSelectorMessage } from './ReportTypeSelectorMessage';
import { SampleReportMessage } from './SampleReportMessage';
import { UserMessageRow } from './UserMessageRow';

interface ChatTranscriptProps {
  messages: ChatMessage[];
  botLoading: boolean;
  showPayCta: boolean;
  selectorDisabled: boolean;
  selectedReportType: ReportType | null;
  onPayForFullReview: () => void;
  onSelectReportType: (reportType: ReportType) => void;
}

export function ChatTranscript({
  messages,
  botLoading,
  showPayCta,
  selectorDisabled,
  selectedReportType,
  onPayForFullReview,
  onSelectReportType,
}: ChatTranscriptProps) {
  return (
    <>
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return <UserMessageRow key={msg.id} message={msg} />;
        }

        if (msg.kind === 'teaser') {
          return (
            <ExpertReviewCard
              key={msg.id}
              teaserReview={msg.text}
              showPayButton={showPayCta}
              onPayForFullReview={onPayForFullReview}
            />
          );
        }

        if (msg.kind === 'report-type-selector') {
          return (
            <ReportTypeSelectorMessage
              key={msg.id}
              selectedReportType={
                msg.reportTypeSelector?.selectedReportType ?? selectedReportType
              }
              disabled={selectorDisabled}
              onSelect={onSelectReportType}
            />
          );
        }

        if (msg.kind === 'sample-report' && msg.sampleReport) {
          return (
            <SampleReportMessage
              key={msg.id}
              data={msg.sampleReport}
              onPayForFullReview={onPayForFullReview}
            />
          );
        }

        return (
          <div key={msg.id} className={`${styles.messageRow} ${styles.assistantRow}`}>
            <div className={styles.messageInner}>
              <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
              <div className={styles.messageBubble}>{msg.text}</div>
            </div>
          </div>
        );
      })}

      {botLoading && <BotTypingIndicator />}
    </>
  );
}
