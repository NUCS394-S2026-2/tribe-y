import React from 'react';
import { useNavigate } from 'react-router-dom';

import CtaSection from '../cta-section/CtaSection';
import Footer from '../footer/Footer';
import HeroSection from '../hero-section/HeroSection';
import ReportCard from '../report-card/ReportCard';
import TopNavBar from '../top-nav-bar/TopNavBar';
import ValuePillars from '../value-pillars/ValuePillars';

export default function LandingPage() {
  const navigate = useNavigate();

  const goToChat = () => navigate('/chat');

  return (
    <div>
      <TopNavBar onCtaClick={goToChat} />
      <main style={{ paddingTop: '4rem' }}>
        <HeroSection onPrimaryClick={goToChat} />
        <ValuePillars />
        <ReportCard />
        <CtaSection onCtaClick={goToChat} />
      </main>
      <Footer />
    </div>
  );
}
