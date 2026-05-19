import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CodeReviewPage } from './agents/CodeReviewPage';
import LandingPage from './components/landing-page/LandingPage';

function TribeHome() {
  return (
    <div className="app-container">
      <LandingPage />
    </div>
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
