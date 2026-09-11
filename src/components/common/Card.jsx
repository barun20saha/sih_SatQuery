import React from 'react';

/**
 * SatQuery AI Card Component
 * Accent options: 'primary' | 'secondary' | 'warning' | 'error' | 'orange'
 */
export default function Card({
  children,
  accent = null,
  lift = false,
  className = '',
  style,
  id,
  onClick,
}) {
  const classes = [
    'card',
    accent ? `card--accent-${accent}` : '',
    lift ? 'card--lift' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div id={id} className={classes} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
