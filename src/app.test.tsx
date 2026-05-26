import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { CompassChatComposer } from './chat/compass-chat/CompassChatComposer';
import LandingPage from './components/landing-page/LandingPage';

describe('LandingPage', () => {
  test('renders the headline', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('renders the Start Session CTA button', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('button', { name: /start session with sales agent/i }),
    ).toBeInTheDocument();
  });
});

describe('CompassChatComposer', () => {
  test('renders the message input and send button', () => {
    render(
      <CompassChatComposer
        disabled={false}
        botLoading={false}
        input=""
        textareaRef={{ current: null }}
        fileInputRef={{ current: null }}
        onInputChange={() => undefined}
        onKeyDown={() => undefined}
        onSend={() => undefined}
        onFileChange={() => undefined}
      />,
    );
    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });
});
