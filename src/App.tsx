import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CompassChat } from './chat/CompassChat';
import LandingPage from './components/landing-page/LandingPage';
import SampleAuditPage from './components/sample-audit/SampleAuditPage';
import { PaymentPage } from './payment/PaymentPage';
import { VaultPage } from './vault/VaultPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<CompassChat />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/vault/:reviewId" element={<VaultPage />} />
        <Route path="/sample" element={<SampleAuditPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
