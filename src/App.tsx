import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CompassChat } from './chat/CompassChat';
import LandingPage from './components/landing-page/LandingPage';
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
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<CompassChat />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/docs/:slug" element={<DocsPage />} />
          </Routes>
        </BrowserRouter>
      </WalletShell>
    </Suspense>
  );
}

export default App;
