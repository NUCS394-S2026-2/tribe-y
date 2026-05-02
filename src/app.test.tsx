import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('App component', () => {
  test('renders the TRIBE Y Teams banner', () => {
    render(<App />);
    expect(screen.getByText('TRIBE Y Teams')).toBeInTheDocument();
  });

  test('renders all Orange team members', () => {
    render(<App />);
    const orangeNames = [
      'Miggiani, Abigail',
      'Ma, Fay',
      'Press, Jack',
      'Turinumugisha, Souvenir',
      'Iyer, Damini',
    ];
    orangeNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test('renders all Yellow team members', () => {
    render(<App />);
    const yellowNames = [
      'Wu, Andy',
      'Wu, Jefferson',
      'Hir, Stanley',
      'Huang, Yimin',
      'Hsieh, Gabriel P.',
    ];
    yellowNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test('renders clickable email links for all members', () => {
    render(<App />);
    const emails = [
      'abbymiggiani2026@u.northwestern.edu',
      'fayma2029@u.northwestern.edu',
      'jackpress2027@u.northwestern.edu',
      'souvenirturinumugisha2028@u.northwestern.edu',
      'daminiiyer2026@u.northwestern.edu',
      'andywu2025@u.northwestern.edu',
      'jeffersonwu2027@u.northwestern.edu',
      'stanleyhir2027@u.northwestern.edu',
      'yiminhuang2028@u.northwestern.edu',
      'gabrielhsieh2026@u.northwestern.edu',
    ];
    emails.forEach((email) => {
      const link = screen.getByRole('link', { name: email });
      expect(link).toHaveAttribute('href', `mailto:${email}`);
    });
  });
});
