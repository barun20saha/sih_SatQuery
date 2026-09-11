import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  SatelliteIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  MenuIcon,
} from './Icons';

export default function AppHeader() {
  const {
    theme,
    toggleTheme,
    setSettingsOpen,
    setMobileNav,
    isMobileNavOpen,
  } = useApp();

  const isMockMode = import.meta.env.VITE_MOCK_MODE !== 'false';

  return (
    <header className="app-header" role="banner">
      <div className="app-header__left">
        <button
          className="header-menu-btn"
          onClick={() => setMobileNav(!isMobileNavOpen)}
          aria-label="Toggle navigation drawer"
        >
          <MenuIcon size={22} />
        </button>

        <Link to="/" className="brand-logo" aria-label="SatQuery AI Dashboard">
          <div className="brand-logo__badge">
            <img src="/brand-logo.png" alt="SatQuery AI Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <div className="brand-logo__info">
            <span className="brand-logo__name">
              SATQUERY <span>AI</span>
            </span>
            <span className="brand-logo__tagline">EARTH INTELLIGENCE</span>
          </div>
        </Link>
      </div>

      <div className="app-header__center">
        <div className="header-status-pill">
          <span className="header-status-pill__dot" />
          <span className="header-status-pill__text">
            {isMockMode ? 'Simulation Engine (Mock Mode)' : 'Neural Backend Connected'}
          </span>
        </div>
      </div>

      <div className="app-header__right">
        {/* Dark / Light Mode Toggle */}
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <MoonIcon size={19} /> : <SunIcon size={19} />}
        </button>

        {/* Settings Dialog Trigger */}
        <button
          className="header-icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Application Settings"
          title="Settings"
        >
          <SettingsIcon size={19} />
          <span className="header-btn-text">Settings</span>
        </button>

        {/* User Profile Pill */}
        <div className="header-user-avatar" title="Analyst Profile (Geospatial Division)">
          <div className="avatar-circle">
            <UserIcon size={17} />
          </div>
          <span className="header-user-name">Analyst</span>
        </div>
      </div>
    </header>
  );
}
