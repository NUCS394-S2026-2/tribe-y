import './App.css';

import { Route, Routes } from 'react-router-dom';

import LandingPage from './components/landing-page/LandingPage';
import PaymentPage from './components/payment-page/PaymentPage';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </div>
  );
}

export default App;
