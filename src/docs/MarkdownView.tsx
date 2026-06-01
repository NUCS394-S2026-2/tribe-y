import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

import styles from './MarkdownView.module.css';

export interface MarkdownViewProps {
  source: string;
}

function isInternalDocsLink(href: string | undefined): href is string {
  if (!href) return false;
  return href.startsWith('/docs/') || href === '/docs';
}

const COMPONENTS: Components = {
  a({ href, children }) {
    if (isInternalDocsLink(href)) {
      return (
        <Link to={href} className={styles.link}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
        {children}
      </a>
    );
  },
  code({ className, children, ...rest }) {
    const text = String(children ?? '').replace(/\n$/, '');
    const match = /language-([\w-]+)/.exec(className ?? '');
    // `react-markdown` v10 no longer passes an `inline` prop; we detect inline
    // code as anything without a language class AND that doesn't contain a
    // newline. Fenced code blocks always carry a language class (or, at
    // minimum, multiple lines).
    const isInline = !match && !text.includes('\n');
    if (isInline) {
      return (
        <code className={styles.inlineCode} {...rest}>
          {children}
        </code>
      );
    }
    const language = match?.[1] ?? 'text';
    return (
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          padding: '14px 16px',
          margin: '12px 0',
          fontSize: '0.82rem',
          lineHeight: 1.55,
        }}
        codeTagProps={{
          className: `language-${language}`,
        }}
      >
        {text}
      </SyntaxHighlighter>
    );
  },
};

export function MarkdownView({ source }: MarkdownViewProps): React.ReactElement {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
