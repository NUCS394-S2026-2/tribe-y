import { useRef, useState } from 'react';

import { isZipFile } from '../../agents/purchasing-agent';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export default function FileUpload({
  file,
  onChange,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSelect(selected: File | null) {
    setLocalError(null);
    if (!selected) {
      onChange(null);
      return;
    }
    const isZip = isZipFile({ name: selected.name, mimeType: selected.type });
    if (!isZip) {
      setLocalError('Only .zip archives are accepted.');
      onChange(null);
      return;
    }
    onChange(selected);
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>Code Archive</span>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className={styles.hiddenInput}
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
        disabled={disabled}
        aria-describedby={localError ? 'file-error' : undefined}
      />
      <button
        type="button"
        className={styles.pickButton}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        {file ? (
          <span className={styles.fileMeta}>
            <span className={styles.fileName}>{file.name}</span>
            <span className={styles.fileSize}>{formatBytes(file.size)}</span>
          </span>
        ) : (
          <span className={styles.placeholder}>Select a .zip archive</span>
        )}
      </button>
      {localError && (
        <span id="file-error" className={styles.error} role="alert">
          {localError}
        </span>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
