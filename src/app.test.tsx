import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App component', () => {
  it('renders the Compass AI logos (nav and footer)', () => {
    render(<App />);
    // Use getAllByText because it appears in both TopNavBar and Footer
    const logos = screen.getAllByText('Compass AI');
    expect(logos).toHaveLength(2);
    expect(logos[0]).toBeInTheDocument();
  });

  it('renders the main hero headline', () => {
    render(<App />);
    expect(
      screen.getByText('High-Precision Code Audits for Strategic M&A'),
    ).toBeInTheDocument();
  });

  it('renders the correct navigation links', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Analysis' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'X.402 Protocol' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Compliance' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enterprise' })).toBeInTheDocument();
  });

  it('renders the primary call to action button', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: 'Start Session with Sales Agent' }),
    ).toBeInTheDocument();
  });
});
