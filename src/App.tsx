import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CodeReviewPage } from './agents/CodeReviewPage';
import { CompassChat } from './chat/CompassChat';
import LandingPage from './components/landing-page/LandingPage';

function TribeHome() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<CompassChat />} />
        <Route path="/code-review" element={<CodeReviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TribeHome />} />
        <Route path="/code-review" element={<CodeReviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
