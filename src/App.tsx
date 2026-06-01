import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CompassChat } from './chat/CompassChat';
import LandingPage from './components/landing-page/LandingPage';
import RiskMetricsPage from './components/risk-metrics/RiskMetricsPage';
import SampleAuditPage from './components/sample-audit/SampleAuditPage';
import ScrollToTop from './components/scroll-to-top/ScrollToTop';
import FinancialStandardsPage from './components/x402-payment-flow/X402PaymentFlowPage';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<CompassChat />} />
        <Route path="/sample" element={<SampleAuditPage />} />
        <Route path="/financial-standards" element={<FinancialStandardsPage />} />
        <Route path="/risk-metrics" element={<RiskMetricsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
