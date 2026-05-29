import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CompassChat } from './chat/CompassChat';
import LandingPage from './components/landing-page/LandingPage';
import { PaymentPage } from './payment/PaymentPage';
import { VaultPage } from './vault/VaultPage';
import { WalletShell } from './wallet/WalletShell';

function App() {
  return (
    <WalletShell>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<CompassChat />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/vault/:reviewId" element={<VaultPage />} />
        </Routes>
      </BrowserRouter>
    </WalletShell>
  );
}

export default App;
