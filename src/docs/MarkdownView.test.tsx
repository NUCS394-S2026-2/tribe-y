import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { MarkdownView } from './MarkdownView';

function renderMd(source: string) {
  return render(
    <MemoryRouter>
      <MarkdownView source={source} />
    </MemoryRouter>,
  );
}

describe('MarkdownView', () => {
  test('renders headings h1-h4', () => {
    renderMd('# H1\n\n## H2\n\n### H3\n\n#### H4');
    expect(screen.getByRole('heading', { level: 1, name: 'H1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'H2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'H3' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'H4' })).toBeInTheDocument();
  });

  test('renders fenced code with language class', () => {
    const { container } = renderMd('```ts\nconst x: number = 1;\n```');
    const codeEl = container.querySelector('code.language-ts');
    expect(codeEl).not.toBeNull();
    expect(codeEl?.textContent ?? '').toContain('const x: number = 1;');
  });

  test('renders internal /docs/ links as React Router links (no new tab)', () => {
    renderMd('See [the quickstart](/docs/quickstart) for details.');
    const link = screen.getByRole('link', { name: /the quickstart/i });
    expect(link).toHaveAttribute('href', '/docs/quickstart');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  test('renders external links with rel="noopener noreferrer" and target="_blank"', () => {
    renderMd('Visit [the spec](https://www.x402.org).');
    const link = screen.getByRole('link', { name: /the spec/i });
    expect(link).toHaveAttribute('href', 'https://www.x402.org');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('renders inline code distinctly from a fenced block', () => {
    const { container } = renderMd('Use `npm test` to run.');
    // inline code rendered as <code> without a language class
    const inlineCodes = container.querySelectorAll('code');
    expect(inlineCodes.length).toBeGreaterThan(0);
    const matchesInline = Array.from(inlineCodes).some(
      (el) => el.textContent === 'npm test' && !el.className.includes('language-'),
    );
    expect(matchesInline).toBe(true);
  });

  test('renders GFM tables', () => {
    renderMd('| col1 | col2 |\n| --- | --- |\n| a | b |');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'a' })).toBeInTheDocument();
  });
});
