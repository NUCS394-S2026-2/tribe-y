import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PaymentPage from './PaymentPage';

const VALID_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/payment']}>
      <PaymentPage />
    </MemoryRouter>,
  );
}

function makeZipFile(): File {
  return new File([new ArrayBuffer(1024)], 'repo.zip', {
    type: 'application/zip',
  });
}

describe('PaymentPage integration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the form heading and submit button on initial load', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /complete purchase/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay & submit/i })).toBeDisabled();
  });

  it('enables submit only when wallet is valid and a zip is uploaded', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderPage();

    const submit = screen.getByRole('button', { name: /pay & submit/i });
    expect(submit).toBeDisabled();

    // valid wallet alone is not enough
    await user.type(screen.getByRole('textbox'), VALID_WALLET);
    expect(submit).toBeDisabled();

    // add a valid zip → now enabled
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, makeZipFile());

    expect(submit).toBeEnabled();
  });

  it('completes the happy path: form → loading → success with vault URL', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderPage();

    await user.type(screen.getByRole('textbox'), VALID_WALLET);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, makeZipFile());

    await user.click(screen.getByRole('button', { name: /pay & submit/i }));

    // loading state appears
    expect(screen.getByText(/processing your purchase/i)).toBeInTheDocument();

    // advance through the stub's 2s delay
    await vi.advanceTimersByTimeAsync(2000);

    // success state renders with vault URL
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /your review is queued/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/payment confirmed/i)).toBeInTheDocument();
    const vaultLink = screen.getByRole('link');
    expect(vaultLink.getAttribute('href')).toMatch(
      /^https:\/\/vault\.compass\.tne\.ai\/receipts\//,
    );
  });
});
