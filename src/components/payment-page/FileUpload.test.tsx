import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import FileUpload from './FileUpload';

function makeFile(name: string, type: string, sizeBytes = 1024): File {
  return new File([new ArrayBuffer(sizeBytes)], name, { type });
}

describe('FileUpload', () => {
  it('renders a placeholder when no file is selected', () => {
    render(<FileUpload file={null} onChange={() => {}} />);
    expect(screen.getByText(/select a .zip archive/i)).toBeInTheDocument();
  });

  it('displays the file name and size when a file is selected', () => {
    const file = makeFile('my-repo.zip', 'application/zip', 2048);
    render(<FileUpload file={file} onChange={() => {}} />);
    expect(screen.getByText('my-repo.zip')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('accepts a valid zip file and calls onChange with it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<FileUpload file={null} onChange={onChange} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(fileInput, makeFile('repo.zip', 'application/zip'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(File);
    expect(onChange.mock.calls[0][0].name).toBe('repo.zip');
  });

  it('rejects a non-zip file and shows an error', () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload file={null} onChange={onChange} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    // fireEvent.change bypasses the `accept` attribute filter that
    // user.upload() respects. We're testing our component's own
    // validation, not the browser's file picker filter.
    fireEvent.change(fileInput, {
      target: {
        files: [makeFile('repo.tar.gz', 'application/gzip')],
      },
    });

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/only \.zip archives/i);
  });

  it('is disabled when disabled prop is set', () => {
    render(<FileUpload file={null} onChange={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
