import React from 'react';

/**
 * SatQuery AI Badge Component
 * Variants:
 *  - 'success'    : #10B981 (✓ Complete)
 *  - 'warning'    : #F59E0B (⚠ Low Confidence)
 *  - 'error'      : #EF5350 (✗ Failed)
 *  - 'processing' : #00D9FF (⟳ Processing)
 *  - 'task'       : #3B82F6 (VQA / Grounding)
 *  - 'neutral'    : Subdued
 */
export default function Badge({
  children,
  variant = 'neutral',
  icon,
  pill = false,
  className = '',
  style,
}) {
  const classes = [
    'badge',
    `badge--${variant}`,
    pill ? 'badge--pill' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} style={style}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
}
