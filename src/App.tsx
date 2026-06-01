import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CompassChat } from './chat/CompassChat';
import LandingPage from './components/landing-page/LandingPage';
import RiskMetricsPage from './components/risk-metrics/RiskMetricsPage';
import SampleAuditPage from './components/sample-audit/SampleAuditPage';
import ScrollToTop from './components/scroll-to-top/ScrollToTop';
import FinancialStandardsPage from './components/x402-payment-flow/X402PaymentFlowPage';
import { DocsPage } from './docs/DocsPage';

// Lazy-load the wallet shell so the ~660KB Solana wallet-adapter bundle
// doesn't ship on the initial page load. The landing page and the docs
// don't need it; it only matters when the user is about to pay.
const WalletShell = React.lazy(() => import('./wallet/WalletShell'));

function App() {
  return (
    <Suspense fallback={null}>
      <WalletShell>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<CompassChat />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/docs/:slug" element={<DocsPage />} />
            <Route path="/sample" element={<SampleAuditPage />} />
            <Route path="/financial-standards" element={<FinancialStandardsPage />} />
            <Route path="/risk-metrics" element={<RiskMetricsPage />} />
          </Routes>
        </BrowserRouter>
      </WalletShell>
    </Suspense>
  );
}

export default App;
