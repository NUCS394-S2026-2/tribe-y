import { useState } from 'react';

import {
  isValidWalletAddress,
  type PurchaseResponse,
  submitPurchase,
} from '../../agents/purchasing-agent';
import FileUpload from './FileUpload';
import styles from './PaymentPage.module.css';
import PaySubmitButton from './PaySubmitButton';
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

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Complete Purchase</h1>
        <p className={styles.subhead}>
          Provide your wallet address and upload your code archive to begin the full
          review.
        </p>

        <WalletInput
          value={wallet}
          onChange={setWallet}
          disabled={view.kind === 'loading'}
        />
        <FileUpload file={file} onChange={setFile} disabled={view.kind === 'loading'} />
        <PaySubmitButton disabled={!canSubmit} onClick={handleSubmit} />

        {view.kind === 'loading' && (
          <p className={styles.loadingText} role="status">
            Processing your purchase…
          </p>
        )}
      </div>
    </main>
  );
}
