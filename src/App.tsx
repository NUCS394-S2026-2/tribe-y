import './App.css';

import React from 'react';

import TeamFrame from './components/TeamFrame';

function App() {
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

export default App;
