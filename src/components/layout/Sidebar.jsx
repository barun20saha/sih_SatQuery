import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  MapIcon,
  ZapIcon,
  HistoryIcon,
  BrainIcon,
  FileTextIcon,
  XIcon,
} from '../common/Icons';

export default function Sidebar() {
  const { isSidebarCollapsed, isMobileNavOpen, setMobileNav, history } = useApp();
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: <MapIcon size={18} />,
      badge: null,
      exact: true,
    },
    {
      to: '/workspace',
      label: 'Analysis',
      icon: <ZapIcon size={18} />,
      badge: 'Active',
      badgeVariant: 'processing',
    },
    {
      to: '/history',
      label: 'History',
      icon: <HistoryIcon size={18} />,
      badge: history.length > 0 ? history.length : null,
      badgeVariant: 'neutral',
    },
    {
      to: '/models',
      label: 'Models',
      icon: <BrainIcon size={18} />,
      badge: '4 Online',
      badgeVariant: 'success',
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: <FileTextIcon size={18} />,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileNav(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isSidebarCollapsed ? 'app-sidebar--collapsed' : ''} ${
          isMobileNavOpen ? 'app-sidebar--mobile-open' : ''
        }`}
        aria-label="Main Navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-header__title">
            <span className="sidebar-header__tag">GEOSPATIAL AI</span>
          </div>
          {isMobileNavOpen && (
            <button
              className="sidebar-close-btn"
              onClick={() => setMobileNav(false)}
              aria-label="Close navigation menu"
            >
              <XIcon size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-nav__list">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <li key={item.to} className="sidebar-nav__item">
                  <NavLink
                    to={item.to}
                    className={`sidebar-nav__link ${isActive ? 'sidebar-nav__link--active' : ''}`}
                    onClick={() => setMobileNav(false)}
                  >
                    <span className="sidebar-nav__icon">{item.icon}</span>
                    <span className="sidebar-nav__label">{item.label}</span>
                    {item.badge && (
                      <span className={`sidebar-nav__badge badge badge--${item.badgeVariant || 'neutral'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <span className="sidebar-nav__indicator" />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer / System Telemetry */}
        <div className="sidebar-footer">
          <div className="sidebar-system-card">
            <div className="sidebar-system-card__header">
              <span className="pulse-dot" />
              <span>Pipeline: Online</span>
            </div>
            <p className="sidebar-system-card__desc">
              Multi-modal Optical + SAR neural engine loaded.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
