import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { DocsPage } from './DocsPage';

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:slug" element={<DocsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DocsPage', () => {
  test('renders the introduction page on /docs', () => {
    renderAt('/docs');
    expect(
      screen.getByRole('heading', { level: 1, name: /Introduction/i }),
    ).toBeInTheDocument();
  });

  test('renders the requested page on /docs/:slug', () => {
    renderAt('/docs/quickstart');
    expect(
      screen.getByRole('heading', { level: 1, name: /Quickstart/i }),
    ).toBeInTheDocument();
  });

  test('shows a "page not found" message for unknown slugs', () => {
    renderAt('/docs/this-does-not-exist');
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });

  test('sidebar highlights the active page', () => {
    renderAt('/docs/agent-card');
    const nav = screen.getByRole('navigation', { name: /documentation navigation/i });
    const activeLink = within(nav).getByRole('link', { name: 'Agent card' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    // A non-active sibling should not be marked current.
    const otherLink = within(nav).getByRole('link', { name: 'JSON-RPC' });
    expect(otherLink).not.toHaveAttribute('aria-current');
  });

  test('clicking another sidebar item navigates and updates the active link', async () => {
    const user = userEvent.setup();
    renderAt('/docs');
    const nav = screen.getByRole('navigation', { name: /documentation navigation/i });
    await user.click(within(nav).getByRole('link', { name: 'Report types' }));
    expect(
      screen.getByRole('heading', { level: 1, name: /Report types/i }),
    ).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Report types' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('shows a Back to chat link', () => {
    renderAt('/docs');
    expect(screen.getByRole('link', { name: /back to chat/i })).toHaveAttribute(
      'href',
      '/chat',
    );
  });
});
