import React from 'react';

/**
 * SatQuery AI Spinner Component (#00D9FF Cyan Blue)
 * Sizes: 'sm' | 'md' | 'lg'
 */
export default function Spinner({ size = 'md', label = 'Processing...' }) {
  return (
    <span
      className={`spinner spinner--${size}`}
      role="status"
      aria-label={label}
    />
  );
}
