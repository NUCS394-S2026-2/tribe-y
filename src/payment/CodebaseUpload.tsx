import React, { useRef, useState } from 'react';

import cardStyles from '../shared/styles/actionCards.module.css';
import { CODEBASE_UPLOAD_MAX_CHARS } from '../shared/types/CodeReview';
import styles from './PaymentPage.module.css';

interface CodebaseUploadProps {
  onFileSelected: (fileName: string, content: string) => void;
}

export function CodebaseUpload({ onFileSelected }: CodebaseUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const text = await file.text();
      const trimmed = text.slice(0, CODEBASE_UPLOAD_MAX_CHARS);
      setFileName(file.name);
      onFileSelected(file.name, trimmed);
    } catch {
      setError('Could not read the selected file.');
    }
  };

  return (
    <div className={cardStyles.paymentCard}>
      <div className={cardStyles.paymentCardTitle}>Upload Codebase</div>
      <p className={styles.uploadHint}>
        Upload your full C++ codebase (.cpp, .h, .zip as text) for a comprehensive review.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".cpp,.h,.hpp,.cc,.cxx,.txt,.zip"
        className={styles.fileInput}
        onChange={handleFileChange}
        aria-label="Upload codebase file"
      />
      <button
        type="button"
        className={cardStyles.btnGhost}
        onClick={() => inputRef.current?.click()}
      >
        Choose File
      </button>
      {fileName && <p className={styles.fileName}>Selected: {fileName}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
