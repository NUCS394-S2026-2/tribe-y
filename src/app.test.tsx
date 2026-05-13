import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import App from './App';

function renderAtRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App component', () => {
  it('renders the Compass AI logos (nav and footer)', () => {
    renderAtRoute('/');
    // Use getAllByText because it appears in both TopNavBar and Footer
    const logos = screen.getAllByText('Compass AI');
    expect(logos).toHaveLength(2);
    expect(logos[0]).toBeInTheDocument();
  });

  it('renders the main hero headline', () => {
    renderAtRoute('/');
    expect(
      screen.getByText('High-Precision Code Audits for Strategic M&A'),
    ).toBeInTheDocument();
  });

  it('renders the correct navigation links', () => {
    renderAtRoute('/');
    expect(screen.getByRole('link', { name: 'Analysis' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'X.402 Protocol' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Compliance' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enterprise' })).toBeInTheDocument();
  });

  it('renders the primary call to action button', () => {
    renderAtRoute('/');
    expect(
      screen.getByRole('button', { name: 'Start Session with Sales Agent' }),
    ).toBeInTheDocument();
  });
});
