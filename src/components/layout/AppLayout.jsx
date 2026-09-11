import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../common/AppHeader';
import Sidebar from './Sidebar';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';

export default function AppLayout() {
  const { isSettingsOpen, setSettingsOpen, theme, toggleTheme } = useApp();

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="app-body">
        <Sidebar />
        <div className="app-main-viewport">
          <Outlet />
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="SatQuery AI — Platform Settings"
        footer={
          <Button variant="primary" onClick={() => setSettingsOpen(false)}>
            Done
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-heading)' }}>
              Appearance
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>Interface Theme</strong>
                <p style={{ fontSize: '12px', margin: 0, color: 'var(--color-text-secondary)' }}>
                  Current: {theme === 'light' ? 'Light Mode (Soft White / Deep Space Blue)' : 'Dark Mode (Deep Space / Slate)'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={toggleTheme}>
                Toggle {theme === 'light' ? 'Dark' : 'Light'}
              </Button>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-heading)' }}>
              Inference &amp; API Configuration
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>API Gateway URL</span>
                <input
                  className="input"
                  readOnly
                  value={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}
                  style={{ marginTop: '4px', fontSize: '12px' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <span>Backend Status: </span>
                <strong style={{ color: 'var(--color-secondary)' }}>
                  {import.meta.env.VITE_MOCK_MODE !== 'false' ? 'Mock Simulation Mode (Active)' : 'Production Remote Sensing Cluster'}
                </strong>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-heading)' }}>
              Geospatial Telemetry
            </h4>
            <ul style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
              <li>✓ CRS Reprojection: WGS 84 / EPSG:4326</li>
              <li>✓ SAR Speckel Despeckling: Lee Multi-look Filter</li>
              <li>✓ Grounding Confidence Threshold: 0.45</li>
              <li>✓ Max GSD Allowed: 30m / pixel</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
