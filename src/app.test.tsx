import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { LandingPage } from './chat/LandingPage';
import { SalesbotChat } from './chat/SalesbotChat';

describe('LandingPage', () => {
  test('renders the headline', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('renders the Start with Salesbot CTA button', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('button', { name: /start with salesbot/i }),
    ).toBeInTheDocument();
  });

  test('renders all four feature cards', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/salesbot/i, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/teaser review/i)).toBeInTheDocument();
    expect(screen.getByText(/x\.402 payment/i)).toBeInTheDocument();
    expect(screen.getByText(/vault receipt/i)).toBeInTheDocument();
  });
});

describe('SalesbotChat', () => {
  test('renders greeting from Salesbot on load', () => {
    render(
      <MemoryRouter>
        <SalesbotChat />
      </MemoryRouter>,
    );
    expect(screen.getByText(/salesbot/i, { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByText(/compass\.tne\.ai/i)).toBeInTheDocument();
  });

  test('renders the message input and send button', () => {
    render(
      <MemoryRouter>
        <SalesbotChat />
      </MemoryRouter>,
    );
    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });
});
