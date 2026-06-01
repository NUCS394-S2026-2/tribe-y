import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import styles from './TopNavBar.module.css';

interface Props {
  onCtaClick?: () => void;
}

export default function TopNavBar({ onCtaClick }: Props) {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <header className={styles.header}>
      <div className={styles.navGroup}>
        {isLanding ? (
          <button
            className={styles.logo}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Compass AI
          </button>
        ) : (
          <Link to="/" className={styles.logo}>
            Compass AI
          </Link>
        )}
        {isLanding && (
          <nav className={styles.nav}>
            <a href="#analysis" className={styles.link}>
              Analysis
            </a>
            <a href="#enterprise" className={styles.link}>
              Enterprise
            </a>
          </nav>
        )}
      </div>
      <button className={styles.ctaButton} onClick={onCtaClick}>
        Connect Consultant Agent
      </button>
    </header>
  );
}
