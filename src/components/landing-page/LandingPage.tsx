import React from 'react';

import CtaSection from '../cta-section/CtaSection';
import Footer from '../footer/Footer';
import HeroSection from '../hero-section/HeroSection';
import ReportCard from '../report-card/ReportCard';
import TopNavBar from '../top-nav-bar/TopNavBar';
import ValuePillars from '../value-pillars/ValuePillars';

export default function LandingPage() {
  return (
    <div>
      <TopNavBar />
      <main style={{ paddingTop: '4rem' }}>
        <HeroSection />
        <ValuePillars />
        <ReportCard />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
