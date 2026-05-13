import { useState } from 'react';

import {
  isValidWalletAddress,
  type PurchaseResponse,
  submitPurchase,
} from '../../agents/purchasing-agent';
import FileUpload from './FileUpload';
import styles from './PaymentPage.module.css';
import PaySubmitButton from './PaySubmitButton';
import ErrorState from './states/ErrorState';
import SuccessState from './states/SuccessState';
import WalletInput from './WalletInput';

type ViewState =
  | { kind: 'form' }
  | { kind: 'loading' }
  | { kind: 'success'; response: Extract<PurchaseResponse, { status: 'success' }> }
  | { kind: 'error'; response: Extract<PurchaseResponse, { status: 'error' }> };

export default function PaymentPage() {
  const [wallet, setWallet] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [view, setView] = useState<ViewState>({ kind: 'form' });

  const isLoading = view.kind === 'loading';
  const isSuccess = view.kind === 'success';
  const canSubmit = isValidWalletAddress(wallet) && file !== null && view.kind === 'form';

  async function handleSubmit() {
    if (!canSubmit || !file) return;
    setView({ kind: 'loading' });
    const response = await submitPurchase({
      walletAddress: wallet,
      file: { name: file.name, sizeBytes: file.size, mimeType: file.type },
    });
    if (response.status === 'success') {
      setView({ kind: 'success', response });
    } else {
      setView({ kind: 'error', response });
    }
  }

  function handleRetry() {
    setView({ kind: 'form' });
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Complete Purchase</h1>
        <p className={styles.subhead}>
          Provide your wallet address and upload your code archive to begin the full
          review.
        </p>

        {!isSuccess && (
          <>
            <WalletInput value={wallet} onChange={setWallet} disabled={isLoading} />
            <FileUpload file={file} onChange={setFile} disabled={isLoading} />
            <PaySubmitButton disabled={!canSubmit} onClick={handleSubmit} />
          </>
        )}

        {view.kind === 'loading' && (
          <p className={styles.loadingText} role="status">
            Processing your purchase…
          </p>
        )}

        {view.kind === 'success' && (
          <SuccessState
            vaultUrl={view.response.vaultUrl}
            transactionId={view.response.transactionId}
          />
        )}

        {view.kind === 'error' && (
          <ErrorState message={view.response.message} onRetry={handleRetry} />
        )}
      </div>
    </main>
  );
}
