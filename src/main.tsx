import './index.css';
import './shared/firebase';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { SolanaWalletProvider } from './payment/SolanaWalletProvider';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </React.StrictMode>,
);
