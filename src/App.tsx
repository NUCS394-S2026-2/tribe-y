import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CodeReviewPage } from './agents/CodeReviewPage';
import TeamFrame from './components/TeamFrame';

function TribeHome() {
  return (
    <div className="App" style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div
        style={{
          width: '100%',
          background: '#222',
          color: '#fff',
          padding: '16px 0',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          textAlign: 'center',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        TRIBE Y Teams
      </div>
      <main
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 80,
          padding: 24,
        }}
      >
        <TeamFrame />
      </main>
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
