import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import WalletInput from './WalletInput';

describe('WalletInput', () => {
  it('renders an empty input with no error initially', () => {
    render(<WalletInput value="" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error message for an invalid wallet format', () => {
    render(<WalletInput value="not-a-wallet" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(/EVM-format address/i);
  });

  it('does not show an error for a valid EVM address', () => {
    render(
      <WalletInput
        value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onChange when the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<WalletInput value="" onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), '0x');

    // userEvent fires onChange per keystroke
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, '0');
    expect(onChange).toHaveBeenNthCalledWith(2, 'x');
  });

  it('is disabled when disabled prop is set', () => {
    render(<WalletInput value="" onChange={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
