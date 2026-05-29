import {
  WalletNotConnectedError,
  WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

import type { X402Quote } from '../agents/reviewerClient';

export interface PayQuoteArgs {
  quote: X402Quote;
  connection: Connection;
  wallet: WalletContextState;
}

/**
 * Build, sign, send and confirm a SOL transfer that satisfies an x402
 * payment quote returned by the reviewer service. Returns the base58
 * transaction signature, which the caller passes back as the
 * `X-Payment` header when retrying the RPC.
 *
 * No wallet UI lives here — the caller is responsible for surfacing the
 * eventual error/success state in chat.
 */
export async function payQuote(args: PayQuoteArgs): Promise<string> {
  const { quote, connection, wallet } = args;

  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error('Connect a wallet first.');
  }

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(quote.recipient);
  } catch {
    throw new Error(`Invalid payment recipient: ${quote.recipient}`);
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: quote.amount,
    }),
  );

  let signature: string;
  try {
    signature = await wallet.sendTransaction(transaction, connection);
  } catch (err) {
    if (err instanceof WalletNotConnectedError) {
      throw new Error('Connect a wallet first.');
    }
    if (err instanceof WalletSignTransactionError) {
      throw new Error('Payment cancelled.');
    }
    // Some wallets throw plain Errors with a `name` of WalletSignTransactionError.
    if (err && typeof err === 'object' && 'name' in err) {
      const name = (err as { name?: string }).name;
      if (name === 'WalletSignTransactionError') {
        throw new Error('Payment cancelled.');
      }
      if (name === 'WalletNotConnectedError') {
        throw new Error('Connect a wallet first.');
      }
    }
    throw err instanceof Error ? err : new Error(String(err));
  }

  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}
